import { User } from "../models/user.model.js";

export const authCallback = async (req, res, next) => {
  try {
    const { id, firstName, lastName, imageUrl } = req.body;
    const fullName = `${firstName || ""} ${lastName || ""}`.trim();

    await User.findOneAndUpdate(
      { clerkId: id },
      {
        $set: {
          fullName,
          // tránh overwrite null/undefined vào field required
          ...(imageUrl && { imageUrl }),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in auth callback", error);
    next(error);
  }
};
