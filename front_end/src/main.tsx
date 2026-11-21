import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import { store } from "./store/store.ts";
import { Provider } from "react-redux";
import { ensureFirebaseAuth } from "./services/firebase";
import { installAuthInterceptor } from "./services/session";

// Expired/revoked tokens end the session globally (see services/session.ts)
installAuthInterceptor(store.dispatch);

// Initialize Firebase Auth session ASAP (uses backend JWT if present)
ensureFirebaseAuth().catch(() => {});

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </Provider>
    </StrictMode>,
);
