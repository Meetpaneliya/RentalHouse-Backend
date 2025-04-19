import { ComponentLoader } from "adminjs";
import path from "path";
import { fileURLToPath } from "url";
const componentLoader = new ComponentLoader();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Components = {
  MyInput: componentLoader.add("MyInput", path.join(__dirname, "./my-input")),
  // other custom components
  LandlordRevenueGraph: componentLoader.add(
    "LandlordRevenueGraph",
    path.join(__dirname, "./components/LandlordRevenueGraph")
  ),
  Dashboard: componentLoader.add(
    "Dashboard",
    path.join(__dirname, "./components/Dashboard")
  ),
  ListingShow: componentLoader.add(
    "ListingShow",
    path.join(__dirname, "./components/ListingShow")
  ),
  KYCShow: componentLoader.add(
    "KYCShow",
    path.join(__dirname, "./components/KYC")
  ),
};

export { componentLoader, Components };
