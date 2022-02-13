import fse from 'fs-extra';
import path from 'path';

// TODO: Use argv to get file
const file = path.join('api.log');

// {"first":"value","second": "value"}
const jsonProperties = [
  'access_token',
  'address',
  'email',
  'family_name',
  'id',
  'last_ip',
  'lastName',
  'name',
  'phone',
  'planId',
  'subscriptionId',
  'user_id',
];

// hostname/page?first=1&second=2
const queryStringParameters = [
  'access_token',
  'apiKey',
  'email',
  'lastName',
  'password',
  'phone',
  'stripeId',
  'userId',
];

const stats = {
  jsonPropertiesRedacted: {},
  queryStringParametersRedacted: {},
  // TODO: Total stats
  // totalJSONPropertiesRedacted: 0,
  // totalRedactedQueryStringParameters: 0,
};

function buildJSONPropertyRegex(property) {
  return new RegExp(`"(${property})":(\\s?)".+?"`, 'g');
}

function buildQueryStringParameterRegex(parameter) {
  // Require either ?|&: `([?&]{1})(${parameter})=.+?(&|\\s)`
  return new RegExp(`([?&]?)(${parameter})=.+?(&|\\s)`, 'g');
}

function main() {
  const jsonPropertiesRegexes = jsonProperties.map((property) => buildJSONPropertyRegex(property));
  const queryStringParametersRegexes = queryStringParameters.map((parameter) => buildQueryStringParameterRegex(parameter));

  let content = fse.readFileSync(file).toString();

  jsonPropertiesRegexes.forEach((jsonPropertyRegex) => {
    content = content.replace(jsonPropertyRegex, (match, $1, $2) => {
      recordStats('jsonPropertiesRedacted', $1);
      // "$1":$2"<redacted>"
      return `"${$1}":${$2}"<REDACTED>"`;
    });
  });

  queryStringParametersRegexes.forEach((queryStringParameterRegex) => {
    content = content.replace(queryStringParameterRegex, (match, $1, $2, $3) => {
      recordStats('queryStringParametersRedacted', $2);
      // '$1$2=<redacted>$3'
      return `${$1}${$2}=<REDACTED>${$3}`;
    });
  });

  console.log(JSON.stringify(stats, null, 2));
  fse.writeFileSync(`${file}.redacted`, content);
}

function recordStats(type, key) {
  if (stats[type][key]) {
    stats[type][key] += 1;
  } else {
    stats[type][key] = 1;
  }
}

main();
