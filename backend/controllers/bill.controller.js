const Bill = require('../models/Bill');
const Drug = require('../models/Drug');
const Patient = require('../models/Patient');
const mongoose = require('mongoose');
const { getIo } = require('../socket');

// Get all bills
exports.getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find().populate('patient', 'name').populate('createdBy', 'name').sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bills', error: error.message });
  }
};

// Create a new bill
exports.createBill = async (req, res) => {
  const { patientId, items, subtotal, tax, totalAmount } = req.body;
  const createdBy = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Validate patient
    const patient = await Patient.findById(patientId).session(session);
    if (!patient) {
      throw new Error('Patient not found.');
    }

    // 2. Check stock and prepare updates
    const stockUpdates = items.map(item => {
      return Drug.updateOne(
        { _id: item.drugId, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } }
      ).session(session);
    });

    const updateResults = await Promise.all(stockUpdates);

    // 3. Verify all updates were successful
    for (const result of updateResults) {
      if (result.nModified === 0) {
        throw new Error('One or more drugs are out of stock or stock is insufficient.');
      }
    }

    // 4. Create the bill
    const newBill = new Bill({
      patient: patientId,
      items: items.map(item => ({
        drug: item.drugId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      subtotal,
      tax,
      totalAmount,
      createdBy,
    });

    await newBill.save({ session });

    // 5. Commit transaction
    await session.commitTransaction();

    // 6. Populate and emit
    const populatedBill = await Bill.findById(newBill._id).populate('patient', 'name').populate('createdBy', 'name');
    const io = getIo();
    io.emit('billCreated', populatedBill);

    // Also emit updates for the drugs whose stock has changed
    const drugIds = items.map(item => item.drugId);
    const updatedDrugs = await Drug.find({ _id: { $in: drugIds } });
    updatedDrugs.forEach(drug => {
        io.emit('drugUpdated', drug);
    });


    res.status(201).json(populatedBill);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: 'Error creating bill', error: error.message });
  } finally {
    session.endSession();
  }
};
