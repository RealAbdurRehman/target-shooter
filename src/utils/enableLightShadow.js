export default function enableLightShadow({
  light,
  far = 2000,
  mapSize = { width: 2048, height: 2048 },
  d = 50,
}) {
  light.castShadow = true;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = far;
  light.shadow.mapSize.width = mapSize.width;
  light.shadow.mapSize.height = mapSize.height;
  light.shadow.bias = -0.0001;

  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
}
