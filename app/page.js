import App from "./app";
import { AppProvider } from './context/AppContext'; // Import the correct Provider

export default function Home() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
