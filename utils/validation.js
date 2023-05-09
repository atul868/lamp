/* eslint global-require: 0 */
module.exports = {
  isLocation: (location) => {
    if (!location) return true;
    const lat = /^\(?[+-]?(90(\.0+)?|[1-8]?\d(\.\d+)?)$/;
    const long = /^\s?[+-]?(180(\.0+)?|1[0-7]\d(\.\d+)?|\d{1,2}(\.\d+)?)\)?$/;

    return lat.test(location.lat) && long.test(location.lng);
  },
  getBoolean(value) {
    switch (value) {
      case true:
      case 'true':
      case 1:
      case '1':
      case 'on':
      case 'yes':
        return true;
      default:
        return false;
    }
  },
  sanetizeNullable(value) {
    if(!value) return undefined;
    if(value === '0') return undefined;
    if(value === '') return undefined;

    return value;
  }
};
