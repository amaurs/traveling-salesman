function module(vector) {
    return Math.sqrt(vector[0] * vector[0] +
                     vector[1] * vector[1] +
                     vector[2] * vector[2]);
}  

function scalarMult(vector, scalar) {
    return [Math.random() * scalar, Math.random() * scalar, Math.random() * scalar];
}

function createRandomVector() {
    return [Math.random(), Math.random(), Math.random()];
}

function normalize(vector) {
  let abs = module(vector);
  let unit = [vector[0]/abs, vector[1]/abs, vector[2]/abs];
  return unit;
}

function sum(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function createRandomUnitVector() {
    return normalize(createRandomVector());
}

export default { module, createRandomVector, scalarMult, normalize, createRandomUnitVector, sum };