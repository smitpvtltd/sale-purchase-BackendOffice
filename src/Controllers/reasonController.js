import Reason from "../Models/reasonModel.js";
import { createReason, getAllReasons } from "../Services/reasonService.js";

//add reasons
export const addReason = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason) return res.status(400).json({ message: "Reason is required" });
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const saved = await createReason(reason, userId);
    res.status(201).json({ message: "Reason added", saved });

  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ message: "Reason already exists" });
    }
    console.error("Add Reason Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


//get reasons
export const fetchReasons = async (req, res) => {
  try {
    const userId = req.user.id;

    const reasons = await Reason.findAll({
      where: { userId },
      order: [["reason", "ASC"]],
    });

    res.status(200).json(reasons);
  } catch (err) {
    console.error("Fetch Reasons Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
