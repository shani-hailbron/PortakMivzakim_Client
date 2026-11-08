const environmentPrefixes = {
  local: 'dev-',
  dev: 'dev-',
  test: 'test-',
  lrn: 'lrn-',
  prod: '',
};

function toJson(values) {
  return Object.entries(values).reduce((result, [key, value]) => {
    result[key] = value && typeof value === 'object' ? JSON.stringify(value) : value;
    return result;
  }, {});
}

function getEnvVariables(environment = 'local') {
  if (!Object.prototype.hasOwnProperty.call(environmentPrefixes, environment)) {
    throw new Error(`Unknown deployment environment: ${environment}`);
  }

  return toJson({
    SVIVA: { sviva: environmentPrefixes[environment] },
    SERVICES: {
      MIVZAKIM: {
        URL: process.env.MIVZAKIM_API_URL || '',
        METHODS: { GET_MIVZAKIM: 'Mivzakim/GetList' },
      },
    },
    URLS: {},
  });
}

module.exports = { getEnvVariables };