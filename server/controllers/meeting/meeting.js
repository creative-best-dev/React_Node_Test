const MeetingHistory = require("../../model/schema/meeting");
const mongoose = require("mongoose");

const add = async (req, res) => {
  try {
    const {
      location,
      agenda,
      related,
      datetime,
      notes,
      attendes,
      attendesLead,
    } = req.body;
    const createBy = req.user.userId;
    console.log(req.user);
    const meetingHistory = {
      location,
      agenda,
      related,
      datetime,
      notes,
    };

    if (attendes) {
      meetingHistory.attendes = attendes;
    }

    if (attendesLead) {
      meetingHistory.attendesLead = attendesLead;
    }
    meetingHistory.createBy = createBy;
    const result = new MeetingHistory(meetingHistory);
    await result.save();
    res.status(200).json({ result });
  } catch (err) {
    console.error("Failed to create :", err);
    res.status(400).json({ err, error: "Failed to create" });
  }
};

const index = async (req, res) => {
  try {
    const query = {};

    if (req.query.createBy) {
      query.createBy = new mongoose.Types.ObjectId(req.query.createBy);
    }

    let result = await MeetingHistory.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "User", // Lookup User who created the meeting
          localField: "createBy",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } }, // Unwind creator field
      {
        $addFields: {
          createByUsername: "$creator.username",
          createByFullName: {
            $concat: [
              { $ifNull: ["$creator.firstName", ""] },
              " ",
              { $ifNull: ["$creator.lastName", ""] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          agenda: 1,
          createBy: 1,
          createByUsername: 1,
          createByFullName: 1,
          timestamp: 1,
        },
      },
    ]);

    if (!result.length) {
      return res.status(404).json({ message: "No meetings found" });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching meetings:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
const view = async (req, res) => {
  try {
    let result = await MeetingHistory.findOne({ _id: req.params.id });

    if (!result) return res.status(404).json({ message: "No data found." });

    let response = await MeetingHistory.aggregate([
      { $match: { _id: result._id } },
      {
        $lookup: {
          from: "Contacts",
          localField: "attendes",
          foreignField: "_id",
          as: "attendesData",
        },
      },
      {
        $lookup: {
          from: "Leads",
          localField: "attendesLead",
          foreignField: "_id",
          as: "attendesLeadData",
        },
      },
      {
        $lookup: {
          from: "User",
          localField: "createBy",
          foreignField: "_id",
          as: "creator",
        },
      },
      { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          createByUsername: "$creator.username",
          createByFullName: {
            $concat: [
              { $ifNull: ["$creator.firstName", ""] },
              " ",
              { $ifNull: ["$creator.lastName", ""] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          agenda: 1,
          createBy: 1,
          createByUsername: 1,
          createByFullName: 1,
          timestamp: 1,
          attendesData: 1, // Returns details of Contacts attending
          attendesLeadData: 1, // Returns details of Leads attending
        },
      },
    ]);

    if (!response.length)
      return res.status(404).json({ message: "Meeting not found." });

    res.status(200).json(response[0]); // Return the first match
  } catch (err) {
    console.error("Failed:", err);
    res.status(400).json({ error: "Failed to fetch meeting details" });
  }
};

const deleteData = async (req, res) => {};

const deleteMany = async (req, res) => {};

module.exports = { add, index, view, deleteData, deleteMany };
