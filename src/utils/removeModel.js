export default function removeModel(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      child.geometry.dispose();

      if (Array.isArray(child.material))
        child.material.forEach((mat) => mat.dispose());
      else child.material.dispose();
    }
  });
}
