import { test, expect } from "@playwright/experimental-ct-react";
import Header from "../src/popup/components/Header";

test.describe("Header Component", () => {
    test("renders header component", async ({ mount }) => {
        const component = await mount(<Header />);
        await expect(component).toBeVisible();
    });
});
