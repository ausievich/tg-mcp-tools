declare module "qrcode-terminal" {
  const qrcode: {
    generate(text: string, options?: { small?: boolean }, callback?: (output: string) => void): void;
    setErrorLevel(level: "L" | "M" | "Q" | "H"): void;
  };
  export default qrcode;
}
