const express = require('express');
const router = express.Router();
const { upload, deleteFile, getFileUrl } = require('../config/upload');
const { authenticateToken } = require('../middleware/auth');
const path = require('path');

// Upload profile image
router.post('/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Return file information
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: getFileUrl(req.file.filename)
    };

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed',
      details: error.message
    });
  }
});

// Delete profile image
router.delete('/profile/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }

    const deleted = deleteFile(filename);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

  } catch (error) {
    console.error('❌ File deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'File deletion failed',
      details: error.message
    });
  }
});

// Get file info
router.get('/profile/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Filename is required'
      });
    }

    const fileUrl = getFileUrl(filename);
    
    res.json({
      success: true,
      file: {
        filename,
        url: fileUrl
      }
    });

  } catch (error) {
    console.error('❌ File info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file info',
      details: error.message
    });
  }
});

module.exports = router;
