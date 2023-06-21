// Başlangıç Tanımlamaları...
let loginButton = document.getElementById("loginButton");
let faceIdButton = document.getElementById("faceIdButton");
let loginContainer = document.getElementById("loginContainer");
let videoContainer = document.getElementById("videoContainer");
let appContainer = document.getElementById("appContainer");
let faceIDResult = document.getElementById("faceIDResult");

let isFaceIDActive = false;
faceIdButton.style.display = "none";

// FaceID için Gereken Kod Bloğu...
const localHost = "http://127.0.0.1:5500";
const video = document.getElementById("video");
let localStream = null;
let isModelsLoaded = false;
let LabeledFaceDescriptors = null;

// Modellerin yüklenmesi..
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(`${localHost}/models`),
  faceapi.nets.faceLandmark68Net.loadFromUri(`${localHost}/models`),
  faceapi.nets.faceRecognitionNet.loadFromUri(`${localHost}/models`),
  faceapi.nets.ssdMobilenetv1.loadFromUri(`${localHost}/models`)
])
  .then(initApp)
  .catch(err => console.error(err));

// initApp
async function initApp() {
  try {
    LabeledFaceDescriptors = await loadImages();
    faceIdButton.style.display = "block";
  } catch (error) {
    console.error(error);
  }
}

async function loadImages() {
  const label = "Serkan";
  const descriptions = [];

  for (let i = 1; i <= 1; i++) {
    try {
      const img = await faceapi.fetchImage(
        `${localHost}/admins/${label}/${i}.jpg`
      );

      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        descriptions.push(detections.descriptor);
      } else {
        console.log(`Yüz tespit edilemedi: ${label}/${i}.jpg`);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return new faceapi.LabeledFaceDescriptors(label, descriptions);
}

function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      localStream = stream;
      video.srcObject = stream;
    })
    .catch(err => console.error(err));
}

function stopCamera() {
  video.pause();
  video.srcObject = null;
  localStream.getTracks().forEach(track => {
    track.stop();
  });
}

// FaceID Kullan/Kullanma...
faceIdButton.addEventListener("click", () => {
  isFaceIDActive = !isFaceIDActive;

  if (isFaceIDActive) {
    videoContainer.classList.add("faceIDShow");
    loginContainer.classList.add("faceIDActive");
    faceIdButton.classList.add("active");
    appContainer.style.backgroundColor = "#666";
    faceIdButton.lastElementChild.textContent = "FaceID Kullanma";
    startCamera();
  } else {
    videoContainer.classList.remove("faceIDShow");
    loginContainer.classList.remove("faceIDActive");
    faceIdButton.classList.remove("active");
    appContainer.style.backgroundColor = "#f4f4f4";
    faceIdButton.lastElementChild.textContent = "FaceID Kullan";
    faceIDResult.textContent = "";
    faceIDResult.style.display = "none";
    stopCamera();
  }
});

video.addEventListener("play", async () => {
  const boxSize = {
    width: video.width,
    height: video.height
  };

  let cameraInterval = setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, boxSize);

    const faceMatcher = new faceapi.FaceMatcher(LabeledFaceDescriptors, 0.6);

    const results = resizedDetections.map(d =>
      faceMatcher.findBestMatch(d.descriptor)
    );

    if (
      results.length > 0 &&
      ["Serkan", "Handan", "İlker", "Sado"].indexOf(results[0].label) > -1
    ) {
      faceIDResult.textContent = "FaceID doğrulandı.. Yönlendiriliyorsunuz..";
      faceIDResult.classList = [];
      faceIDResult.classList.add("success");
      faceIDResult.style.display = "block";
      clearInterval(cameraInterval);
      setTimeout(() => {
        location.href = "about.html";
      }, 10000);
    } else {
      faceIDResult.textContent = "FaceID doğrulanamadı...";
      faceIDResult.classList = [];
      faceIDResult.classList.add("error");
      faceIDResult.style.display = "block";
    }
  }, 100);
});
