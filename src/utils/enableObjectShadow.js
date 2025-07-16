export default function enableObjectShadow(
  object,
  shouldCast = true,
  shouldReceive = true
) {
  object.castShadow = shouldCast;
  object.receiveShadow = shouldReceive;
}
