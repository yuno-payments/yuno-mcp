import { main } from "./run";

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(String(error));
    process.exitCode = 2;
  });
