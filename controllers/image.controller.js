function upload(req, res) {
    console.log(req.file);

    // Check if the file is provided
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "File is required.",
        });
    }

    // Check if the file has a filename
    if (req.file.filename) {
        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully.",
            url: req.file.filename,
        });
    } else {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
        });
    }
}

module.exports = {
    upload: upload,
};
