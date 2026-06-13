const httpStatus = require('http-status').default;
const catchAsync = require('../../utils/catchAsync');
const viewer360Service = require('../../shared/services/viewer360.service');

const getSpinData = catchAsync(async (req, res) => {
  const data = await viewer360Service.getCarSpinImages(req.params.carId);
  res.send(data);
});

const getViewerUrl = catchAsync(async (req, res) => {
  const data = await viewer360Service.getCarSpinImages(req.params.carId);
  res.send({
    carId: data.id,
    name: data.name,
    has360: data.has360,
    view360Url: data.view360Url,
    viewerDataUrl: data.viewerDataUrl,
    frameCount: data.frameCount,
  });
});

const renderViewerPage = catchAsync(async (req, res) => {
  const data = await viewer360Service.getCarSpinImages(req.params.carId, { strict: true });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>360 Viewer - ${data.name}</title>
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://unpkg.com/spritespin@4.1.0/release/spritespin.js"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000;
      display: flex; justify-content: center; align-items: center; font-family: system-ui, sans-serif; }
    #viewer { width: 100vw; height: 56.25vw; max-width: 1024px; max-height: 576px; }
    .loading-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.9); color: #fff;
      display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10; }
    .loader { width: 40px; height: 40px; border: 4px solid #333; border-top-color: #4F46E5;
      border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hint { position: absolute; bottom: 24px; color: #aaa; font-size: 14px; }
  </style>
</head>
<body>
  <div id="loading" class="loading-overlay">
    <div class="loader"></div>
    <div>Loading 360° view...</div>
  </div>
  <div id="viewer"></div>
  <div class="hint">Drag to rotate</div>
  <script>
    $(function () {
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
        onComplete: function () { $("#loading").fadeOut(); }
      });
    });
  </script>
</body>
</html>`;

  res.send(html);
});

const renderUnavailablePage = catchAsync(async (req, res) => {
  res.status(httpStatus.NOT_FOUND).send(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>360° view not available</h2><p>This car does not have a 360° tour yet.</p></body></html>`);
});

module.exports = { getSpinData, getViewerUrl, renderViewerPage, renderUnavailablePage };
