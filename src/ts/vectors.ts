// calculate euler angles from quaternion
export const convertToEuler = (quat: number[]) => {
  const q0 = quat[0];
  const q1 = quat[1];
  const q2 = quat[2];
  const q3 = quat[3];

  const Rx = Math.atan2(2 * (q0 * q1 + q2 * q3), 1 - 2 * (q1 * q1 + q2 * q2));
  const Ry = Math.asin(2 * (q0 * q2 - q3 * q1));
  const Rz = Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3));

  const euler = [Rx, Ry, Rz];

  return euler;
};

export const getOrientationAbs = (quat: number[]) => convertToEuler(quat)[1];

export const isolateYaw = (quat: {
  w: number;
  x: number;
  y: number;
  z: number;
}) => {
  const mag = Math.sqrt(quat.w * quat.w + quat.y * quat.y);
  return {
    w: quat.w / mag,
    x: 0,
    y: quat.y / mag,
    z: 0,
  };
};

export const multiply = (v: number[], c: number) => v.map((x) => x * c);
