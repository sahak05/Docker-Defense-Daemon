import { render } from "@testing-library/react";
import App from "./App";

test("renders dashboard title", () => {
  const { getByText } = render(<App />);
  expect(getByText(/Dashboard/i)).toBeInTheDocument();
});
