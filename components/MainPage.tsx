import React, { ReactElement, useEffect, useReducer, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, SafeAreaView, StyleSheet, Animated } from "react-native";
import {
    initialState,
    helperReducer,
    HelperState,
} from "../state/reducers/helpReducer";
import ACTIONS from "../state/actions/helpActions";
import axios, { AxiosResponse } from "axios";
import { auth, checkApiUsageLimit, checkSubscriptionStatus } from "../firebaseConfig";
import Description from "./Description";
import { useNavigation } from "@react-navigation/native";
import DayLimitModal from "./DayLimitModal";
import { MAX_KEYWORDS, images, dataPreparationForPromt } from "../helpers";
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'react-native-linear-gradient';
import { Grayscale } from 'react-native-image-filter-kit';
import {
    REACT_APP_GPT_KEY
} from "@env";

interface ChangeKeywordAction {
    type: typeof ACTIONS.CHANGE_KEYWORD;
    payload: string;
}

interface ChangeServiceAction {
    type: typeof ACTIONS.CHANGE_SERVICE;
    payload: string;
}

interface DayLimitAction {
    type: typeof ACTIONS.DAY_LIMIT;
}

interface DeleteKeywordAction {
    type: typeof ACTIONS.DELETE_KEYWORD;
    payload: string;
}

interface ChangeDescriptionAction {
    type: typeof ACTIONS.CHANGE_DESCRIPTION;
    payload: any;
}

interface ClearDataAction {
    type: typeof ACTIONS.CLEAR_DATA;
}

type AppAction =
    | ChangeKeywordAction
    | ChangeServiceAction
    | DayLimitAction
    | DeleteKeywordAction
    | ChangeDescriptionAction
    | ClearDataAction;

interface MainPageProps {
    navigation: IntroScreenNavigationProp;
    subscriptionPaid: boolean;
}

type IntroScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type RootStackParamList = {
    Login: undefined;
    Payment: undefined;
};

const MainPage = ({ subscriptionPaid }: MainPageProps): ReactElement => {
    const [state, dispatch] = useReducer<React.Reducer<HelperState, AppAction>>(
        helperReducer,
        initialState
    );
    const [openService, setOpenService] = useState<string[]>([]);
    const [keyword, setKeyword] = useState<string>('');
    const [isGenerated, setIsGenerated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation<IntroScreenNavigationProp>();
    const scaleValue = useRef(new Animated.Value(1)).current;

    const animateScale = () => {
        Animated.sequence([
          // Уменьшение до 0.5
          Animated.timing(scaleValue, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          // Возвращение к исходному размеру (1)
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Повтор анимации
          animateScale();
        });
      };

    const toggleServiceVisibility = (service: string) => {
        setOpenService((prev) =>
            prev.includes(service)
                ? prev.filter((s) => s !== service)
                : [...prev, service]
        );
    };

    useEffect(() => {
        const fetchKeyAndStatus = async () => {
            if (!auth.currentUser) {
                console.error("User is not authenticated");
                return;
            }
            await checkSubscriptionStatus(dispatch);
        };

        fetchKeyAndStatus();
        animateScale();
    }, []);

    const handleInputKeywords = (keyword: string): void | boolean => {
        if (!keyword) {
            return;
        }
        const keywordsArray = keyword.split(/[\s,.;:]+/).filter(Boolean);
        if (keywordsArray.length > MAX_KEYWORDS) {
            keywordsArray.length = MAX_KEYWORDS;
        }
        keywordsArray.forEach((word) => {
            dispatch({
                type: ACTIONS.CHANGE_KEYWORD,
                payload: word,
            });
        });
        setKeyword('');
    };

    const handleRemoveKeyword = (keyword: string): void => {
        dispatch({
            type: ACTIONS.DELETE_KEYWORD,
            payload: keyword,
        });
    };

    const handleInputServices = (service: string): void => {
        dispatch({
            type: ACTIONS.CHANGE_SERVICE,
            payload: service,
        });
    };

    const goOnGeneratePage = () => {
        setIsGenerated(false);
        dispatch({
            type: ACTIONS.CLEAR_DATA,
        });
    };

    const fetchChatGPTResponse = async (): Promise<void> => {
        const isAllowed = await checkApiUsageLimit(state.service.length, dispatch);
        if (!isAllowed) {
            dispatch({
                type: ACTIONS.DAY_LIMIT,
            });
            return;
        }
        if (state.service.length === 0 || state.keywords.length === 0) {
            return;
        }

        setLoading(true);
        const apiUrl: string = "https://api.openai.com/v1/chat/completions";
        let prompt = dataPreparationForPromt(state.keywords, state.service);

        try {
            const response: AxiosResponse<any, any> = await axios.post(
                apiUrl,
                {
                    model: "gpt-4o",
                    messages: [{ role: "user", content: prompt }],
                },
                {
                    headers: {
                        Authorization: `Bearer ${REACT_APP_GPT_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            const services: Record<"youtube" | "facebook" | "instagram" | "tiktok", string> = {
                youtube: "",
                facebook: "",
                instagram: "",
                tiktok: ""
            };

            const regex = /(\w+):\s([^:\n]+)/g;
            let match;

            while ((match = regex.exec(response.data.choices[0].message.content)) !== null) {
                const service = match[1].toLowerCase();
                const description = match[2].trim();

                if (service in services) {
                    services[service as keyof typeof services] = description;
                }
            }

            const answer = state.service.length > 1 ? services : { [state.service[0]]: response.data.choices[0].message.content };

            dispatch({
                type: ACTIONS.CHANGE_DESCRIPTION,
                payload: answer
            });

            setLoading(false);
            setIsGenerated(true);
        } catch (error) {
            console.error("Error fetching ChatGPT response:", error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingWrapper}>
                <Animated.Image source={require('../assets/img/loading.png')} style={[styles.loadingImg, { transform: [{ scale: scaleValue }] }]} />
                {/* <Image source={require('../assets/img/loading.png')} style={styles.loadingImg} /> */}
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", flexDirection: 'column', paddingVertical: 50, backgroundColor: '#fff' }}>
            {!isGenerated ? (
                <View style={styles.mainWrapper}>

                    <View style={styles.startWrapper}>
                        <Text style={{ height: 64, backgroundColor: 'red' }}>TEST</Text>
                        <TextInput
                            style={[styles.input]}
                            value={keyword}
                            onChangeText={setKeyword}
                            placeholder="Enter up to 5 keywords"
                            placeholderTextColor="rgba(24, 129, 194, 0.5)"
                            onSubmitEditing={() => handleInputKeywords(keyword)}
                        />

                        {state.keywords.length > 0 && (
                            <View style={styles.keywordsWrapper}>
                                {state.keywords.map((word) => (
                                    <TouchableOpacity style={styles.keywordWrapper} key={word} onPress={() => handleRemoveKeyword(word)}>
                                        <Text style={styles.keywordText}>{word}</Text>
                                        <Image style={styles.keywordImg} source={require('../assets/img/X.png')} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.middleWrapper}>
                        {state.services.map((service: string, index: number) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleInputServices(service)}
                                style={[{ margin: 17 }]}
                            >
                                {state.service.includes(service) ? (
                                    <Image
                                        style={styles.middleImg}
                                        source={images[service]}
                                    />
                                ) : (
                                    <Grayscale style={{ opacity: 0.5 }} image={
                                        <Image
                                            style={styles.middleImg}
                                            source={images[service]}
                                        />
                                    } />


                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.endWrapper}>
                        <LinearGradient
                            colors={['#EE4239', '#FDBC22',]}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={[styles.button, { marginBottom: 22 }]}
                        >
                            <TouchableOpacity onPress={() => navigation.navigate('Payment')} style={{ marginBottom: 10 }}>
                                <Text style={styles.buttonText}>GO PREMIUM</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                        <LinearGradient
                            colors={['#147FC2', '#0A567D', '#093C5C']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.button, (state.service.length === 0 || state.keywords.length === 0) ? { opacity: 0.5 } : { opacity: 1 }]}
                        >
                            <TouchableOpacity
                                onPress={fetchChatGPTResponse}
                                disabled={state.service.length === 0 || state.keywords.length === 0}
                            >
                                <Text style={styles.buttonText}>GENERATE</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            ) : (
                <View style={styles.generatedWrapper}>
                    <View>
                        <Image style={styles.logo} source={require("../assets/img/logo.png")} />

                        {Object.entries(state.info).map(([service, { description }], index) => {
                            const isOpen = openService.includes(service);
                            if (!description) return null;

                            return (
                                <View key={index} >
                                    <View style={styles.generatedContainer}>
                                        <TouchableOpacity style={styles.generatedTitle} onPress={() => toggleServiceVisibility(service)}>

                                            <Image
                                                style={styles.generatedImg}
                                                source={images[service]}
                                            />
                                            <View style={[styles.generatedTextWrapper, isOpen ? { backgroundColor: '#147FC2' } : {}]}>
                                                <Text style={[styles.generatedText, isOpen ? { color: '#fff' } : {}]}>{service} {service === 'youtube' ? 'shorts' : 'reels'}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>

                                    {isOpen && (
                                        <Description description={description} />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.buttonWrapper}>
                        <TouchableOpacity style={[styles.button, { backgroundColor: '#1881C2', width: 50, height: 50, borderRadius: 50 }]} onPress={goOnGeneratePage}>
                            <Text style={styles.buttonText}>&larr;</Text>
                        </TouchableOpacity>
                        <LinearGradient
                            colors={['#EE4239', '#FDBC22',]}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={[styles.button, { marginLeft: 10, flexGrow: 1 }]}
                        >
                            <TouchableOpacity onPress={() => navigation.navigate('Payment')}>
                                <Text style={styles.buttonText}>GO PREMIUM</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            )}
            <DayLimitModal
                limit={state.limit}
                isOpen={state.dayLimitModal}
                onClose={() => dispatch({ type: ACTIONS.DAY_LIMIT })}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    loadingWrapper: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },

    loadingImg: {
        width: 336, alignSelf: 'center',
        resizeMode: 'contain'
    },

    mainWrapper: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        alignContent: 'center'
    },

    startWrapper: {

    },

    middleWrapper: {
        flexDirection: "column",
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 228,
        flexWrap: 'wrap',
        marginHorizontal: 'auto'
    },

    middleImg: {
        height: 80,
        width: 80,
    },

    endWrapper: {
        flexDirection: 'column',
        width: '100%'
    },

    keywordsWrapper: {
        marginVertical: 10,
        flexDirection: 'row',
        flexWrap: 'wrap'
    },

    keywordWrapper: {
        borderWidth: 1,
        borderColor: '#147FC2',
        marginHorizontal: 5,
        borderRadius: 25,
        paddingLeft: 10,
        paddingVertical: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },

    keywordText: {
        color: '#1881C2',
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 19,
        letterSpacing: -0.32,
    },

    keywordImg: {
        width: 10,
        height: 10,
        marginHorizontal: 10
    },

    input: {
        fontFamily: "Nunito Sans 10pt",
        fontSize: 24,
        color: '#1881C2',
        fontStyle: 'italic',

        marginTop: 11,
        width: '100%',
        paddingLeft: 24,
        paddingRight: 24,
        borderRadius: 30,
        height: 50,

        borderColor: '#147FC2',
        borderWidth: 2,
    },

    logo: {
        width: '100%',
        margin: 0,
        alignSelf: 'center',
        resizeMode: 'contain',
    },

    generatedWrapper: {
        flex: 1,
        paddingHorizontal: 16,
        justifyContent: 'space-between'
    },

    generatedContainer: {
        flexDirection: 'column',
        paddingLeft: 25

    },

    generatedTitle: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5
    },

    generatedTextWrapper: {
        flexGrow: 1,
        height: 40,
        borderWidth: 2,
        borderColor: '#147FC2',
        /* height: '100%', */
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginLeft: 10,
    },

    generatedText: {
        fontFamily: "Nunito Sans 10pt SemiCondensed",
        textTransform: 'uppercase',
        color: '#1881C2',
        textAlign: 'center',
        fontSize: 18,
        letterSpacing: 1,

    },

    generatedImg: {
        width: 40,
        height: 40
    },

    buttonWrapper: {
        flexDirection: 'row',
        marginTop: 15
    },

    buttonText: {
        fontFamily: "Nunito Sans 10pt",
        fontSize: 24,
        fontStyle: 'normal',
        lineHeight: 50,
        letterSpacing: 2,
        color: '#FFF',
        textAlign: 'center'
    },

    button: {
        borderRadius: 30,
        height: 50
    },
});


export default MainPage;