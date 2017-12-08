var Observable = require("FuseJS/Observable");
var CameraRoll = require("FuseJS/CameraRoll");
var Camera = require("FuseJS/Camera");
var ImageTools = require('FuseJS/ImageTools');

var cornerList = Observable(
    {id:0, x: Observable(0), y: Observable(0)},
    {id:1, x: Observable(0), y: Observable(0)},
    {id:2, x: Observable(0), y: Observable(0)},
    {id:3, x: Observable(0), y: Observable(0)}
);

var postUrl = "https://YOUR.API.ENDPOINT";

var uploadedImage = Observable();
var imageElmInfo = {height: 0, width: 0, x: 0, y: 0};
var isImageUploaded = uploadedImage.map(function(image) {
    if (uploadedImage.value == null) {
        return false;
    }
    return uploadedImage.value.path.length > 0;
});
var showCropPanel = Observable(false);

function onTakePictureClicked() {
    Camera.takePicture(1024, 768)
    .then(function(image) {
        uploadedImage.value = image;
        showCropPanel.value = true;
    }).catch(function(e){
        console.log("Error");
        console.log(e);
    });
}

function onSelectPictureClicked() {
    CameraRoll.getImage()
    .then(function(image) {
        // if ((image.width < 640 && image.height < 480) || (image.width < 480 && image.height < 640)) {
        //     throw new Exception("too small image");
        // }
        var resizeOptions = {
            mode: ImageTools.KEEP_ASPECT,
        };
        if (image.width < image.height) {
            resizeOptions['desiredWidth'] = 768;
            resizeOptions['desiredHeight'] = 1024;
        } else {
            resizeOptions['desiredWidth'] = 1024;
            resizeOptions['desiredHeight'] = 768;
        }
        return ImageTools.resize(image, resizeOptions);
    }).then(function(image) {
        uploadedImage.value = image;
        showCropPanel.value = true;
    }, function(error) {
        console.log(JSON.stringify(error));
    });
}

function onCancelPictureClicked() {
    uploadedImage.value = null;
}

function onUploadImageClicked() {
    if (!isImageUploaded.value) {
        return;
    }

    ImageTools.getBase64FromImage(uploadedImage.value)
    .then(function(b64image) {
        var cornerListPayload = [];
        // この例では、縦長画像のみを想定しています。
        var scale = uploadedImage.value.height / imageElmInfo.height;
        cornerList.forEach(function(c) {
            cornerListPayload.push([
                Math.round((c.x.value - imageElmInfo.x) * scale),
                Math.round((c.y.value - imageElmInfo.y) * scale)
            ]);
        });
        var payload = {
            'img': b64image,
            'corner_list': cornerListPayload,
        };
        payload = JSON.stringify(payload)
        console.log(payload);
        return fetch(postUrl, {
            method: "POST",
            headers: new Headers({"Content-type": "application/json"}),
            credentials: 'include',
            body: payload
        }).then(function(response) {
            return new Promise(function(resolve, reject) {
                if (response.ok) {
                    resolve(response.json());
                } else {
                    console.log('failed to post.');
                    reject(response);
                }
            });
        });
    }).catch(function(e) {
        console.log("upload failed.");
        console.log(e.status, e.statusText, e.toString());
    });
}

function onCloseCropPanelClicked() {
    uploadedImage.value = null;
    showCropPanel.value = false;
}

function imagePlaced(args) {
    var aspRatio = uploadedImage.value.width / uploadedImage.value.height;
    var imgWidth = args.height * aspRatio;
    var leftX = Math.floor((args.width - imgWidth) / 2);
    var rightX = Math.floor(args.width - leftX);
    cornerList.getAt(0).x.value = leftX;
    cornerList.getAt(0).y.value = args.y;
    cornerList.getAt(1).x.value = leftX;
    cornerList.getAt(1).y.value = args.y + args.height;
    cornerList.getAt(2).x.value = rightX;
    cornerList.getAt(2).y.value = args.y + args.height;
    cornerList.getAt(3).x.value = rightX;
    cornerList.getAt(3).y.value = args.y;

    imageElmInfo.height = args.height;
    imageElmInfo.width = args.width;
    imageElmInfo.x = leftX;
    imageElmInfo.y = args.y;
}

module.exports = {
    uploadedImage: uploadedImage,
    isImageUploaded: isImageUploaded,
    onTakePictureClicked: onTakePictureClicked,
    onSelectPictureClicked: onSelectPictureClicked,
    onCancelPictureClicked: onCancelPictureClicked,
    onUploadImageClicked: onUploadImageClicked,
    showCropPanel: showCropPanel,
    cornerList: cornerList,
    onCloseCropPanelClicked: onCloseCropPanelClicked,
    imagePlaced: imagePlaced,
};
