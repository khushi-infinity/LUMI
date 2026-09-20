/**
 * AWS client configuration. Amplify Hosting reserves `AWS_*` env var names,
 * so on Amplify we use LUMI_* names; locally .env.local can use either.
 * Credentials are passed explicitly so clients work in both environments.
 */
export function awsConfig(): {
  region: string;
  credentials?: { accessKeyId: string; secretAccessKey: string };
} {
  const region = process.env.LUMI_AWS_REGION || process.env.AWS_REGION || "us-west-2";
  const accessKeyId =
    process.env.LUMI_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.LUMI_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  return {
    region,
    credentials:
      accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  };
}

export function hasAwsCredentials(): boolean {
  const { credentials } = awsConfig();
  return Boolean(credentials);
}
