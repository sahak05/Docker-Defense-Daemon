import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders dashboard title", () => {
  render(<App />);
  const navButton = screen.getByRole("button", { name: /dashboard/i });
  expect(navButton).toBeInTheDocument();
});
