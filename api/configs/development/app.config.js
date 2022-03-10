const config = {
  PORT: 5000,
  HASH_PREFIX: "$2b$04$",
  JWT_SECRET: "b3715d5693ef63a7f77454f671a3270a",
  UNRESTRICTED_ROUTES : ["^/auth$"]

};

module.exports = config;
