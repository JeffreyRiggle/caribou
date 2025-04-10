const AWS = require('aws-sdk');
const postgres = require('postgres');
const path = require('path');

const secrets = new AWS.SecretsManager({});

exports.handler = async (e) => {
  try {
    const { config } = e.params
    const { password, username, host } = await getSecretValue(config.secretName);
    const sql = postgres({
      username,
      password,
      host,
      port: 5432,
      ssl: { rejectUnauthorized: false }
    });

    const res = await sql.file(path.join(__dirname, './seed_db_rds.sql'));

    return {
      status: 'OK',
      results: res
    };
  } catch (err) {
    return {
      status: 'ERROR',
      err,
      message: err.message
    };
  }
}

function getSecretValue (secretId) {
  return new Promise((resolve, reject) => {
    secrets.getSecretValue({ SecretId: secretId }, (err, data) => {
      if (err) return reject(err);

      return resolve(JSON.parse(data.SecretString));
    })
  })
}