export const uploadFile = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  return res.status(201).json({ url: fileUrl });
};
