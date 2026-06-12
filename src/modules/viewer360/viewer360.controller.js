const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const viewer360Service = require('./viewer360.service');
const ApiError = require('../../utils/ApiError');

const getSpinData = catchAsync(async (req, res) => {
  const data = await viewer360Service.getCarSpinImages(req.params.carId);
  res.send(data);
});

const uploadVideo = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload a video file');
  }
  
  const car = await viewer360Service.processVideoTo360(req.params.carId, req.file);
  res.status(httpStatus.OK).send({
    message: 'Video processed successfully and 360 viewer images updated',
    car: {
      id: car.id,
      spinImages: car.spinImages
    }
  });
});

const renderViewerPage = catchAsync(async (req, res) => {
  const data = await viewer360Service.getCarSpinImages(req.params.carId);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>360 Viewer - ${data.name}</title>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://unpkg.com/spritespin@4.1.0/release/spritespin.js"></script>
    <style>
        body, html {
            margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
            background-color: #000;
            display: flex; justify-content: center; align-items: center;
        }
        #viewer-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
        #viewer { width: 100vw; height: 56.25vw; max-width: 1024px; max-height: 576px; }
        .loading-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.9); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 100;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #fff;
        }
        .loader {
            border: 4px solid #f3f3f3; border-top: 4px solid #3498db;
            border-radius: 50%; width: 40px; height: 40px;
            animation: spin 2s linear infinite; margin-bottom: 20px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div id="loading" class="loading-overlay">
        <div class="loader"></div>
        <div>Initializing 360° Real-View...</div>
    </div>
    <div id="viewer-container">
        <div id="viewer"></div>
    </div>

    <script>
        $(function() {
            const spinImages = ${JSON.stringify(data.spinImages)};
            
            $("#viewer").spritespin({
                source: spinImages,
                width: 1024,
                height: 576,
                sense: 1,
                responsive: true,
                animate: false,
                touch: true,
                drag: true,
                onComplete: function() {
                  $("#loading").fadeOut();
                }
            });
        });
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

module.exports = {
  getSpinData,
  uploadVideo,
  renderViewerPage,
};
