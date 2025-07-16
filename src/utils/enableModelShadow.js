export default function enableModelShadow(
  model,
  shouldCast = true,
  shouldReceive = true
) {
  model.traverse((child) => {
    child.castShadow = shouldCast;
    child.receiveShadow = shouldReceive;
  });
}
