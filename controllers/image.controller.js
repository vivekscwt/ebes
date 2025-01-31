const models = require('../models');

async function upload(req, res) {

    // Check if the file is provided
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "File is required.",
        });
    }

    // Check if the file has a filename
    if (req.file.filename) {
        const adding_image = await models.Media.create({path: req.file.path});
        
        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully.",
            result : req.file.filename,
        });
    } else {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
        });
    }
}

async function addImage(req, res){
    try{
        const {image_path} = req.body;
        const existingImagePath = await models.Media.findOne({ where: { path:image_path } });
    
            if (existingImagePath) {
            return res.status(409).json({
                success: false,
                message: "Image already exists!",
            });
        }
        const adding_image = await models.Media.create({path:image_path});
        return res.status(201).json({
            success: true,
            message: "Image uploaded successfully.",
            result: image_path,
        });
    } catch(error){
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
        });
    }
}

async function getImages(req, res){
    try{
        const getImages = await models.Media.findAll();

        return res.status(201).json({
            success: true,
            message: "Images fetched successfully.",
            result: getImages,
        });
    } catch(error){
        console.log("eroor",error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
        });
    }
}

async function deleteImage(req, res) {
    try {
        const { ids } = req.body; 
        console.log("ids",ids);
        

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide an array of image IDs to delete.",
            });
        }

        const deletedCount = await models.Media.destroy({
            where: { id: ids }  
        });

        if (deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "No images found with the provided IDs.",
            });
        }

        return res.status(200).json({
            success: true,
            message: `${deletedCount} image(s) deleted successfully.`,
        });

    } catch (error) {
        console.error("Error deleting images:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
}





module.exports = {
    upload: upload,
    addImage: addImage,
    getImages:getImages,
    deleteImage: deleteImage
};
