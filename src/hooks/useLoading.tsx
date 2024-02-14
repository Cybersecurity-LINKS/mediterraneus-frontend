// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

// https://stackoverflow.com/questions/66592593/global-screen-loader-in-react
import { PropsWithChildren, createContext, useContext, useState } from "react";

interface LoadingContext {
    loading: boolean
    setLoading: (loading: boolean) => void
}

const LoadingContext = createContext<LoadingContext>({
    loading: false,
    setLoading: () => {},
});
  
export function LoadingProvider({ children }: PropsWithChildren) {
    const [loading, setLoading] = useState(false);
    const value = { loading, setLoading };
    return (
        <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error("useLoading must be used within LoadingProvider");
    }
    return context
}