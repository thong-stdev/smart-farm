import { createContext, useContext, useEffect, useState, useRef } from 'react';
import liff from '@line/liff';
import logger from '../utils/logger';

const LiffContext = createContext({});

export const useLiff = () => useContext(LiffContext);

export const LiffProvider = ({ children }) => {
    const [liffObject, setLiffObject] = useState(null);
    const [liffError, setLiffError] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [profile, setProfile] = useState(null);

    const initRef = useRef(false);

    const initLiff = async () => {
        if (initRef.current) return;
        initRef.current = true;
        try {
            const liffId = import.meta.env.VITE_LIFF_ID;
            if (!liffId) {
                logger.warn('VITE_LIFF_ID is not defined');
                return;
            }
            logger.info('Initializing LIFF with ID:', liffId);
            await liff.init({ liffId });
            setLiffObject(liff);
            if (liff.isLoggedIn()) {
                const userProfile = await liff.getProfile();
                setProfile(userProfile);
            }
            setIsReady(true);
        } catch (error) {
            logger.error('LIFF Initialization failed', error);
            setLiffError(error);
            setIsReady(true);
        }
    };

    useEffect(() => {
        initLiff();
    }, []);

    const login = () => {
        if (!liffObject) return;
        if (!liffObject.isLoggedIn()) {
            liffObject.login();
        }
    };

    const logout = () => {
        if (!liffObject) return;
        if (liffObject.isLoggedIn()) {
            liffObject.logout();
            setProfile(null);
            window.location.reload();
        }
    };

    return (
        <LiffContext.Provider
            value={{
                liff: liffObject,
                liffError,
                isReady,
                profile,
                login,
                logout,
                isInClient: liff.isInClient(),
            }}
        >
            {children}
        </LiffContext.Provider>
    );
};
