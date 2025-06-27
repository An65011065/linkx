import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../shared/services/firebase";

interface ChatResponse {
    data: {
        output_text: string;
    };
}

class AIService {
    private static instance: AIService;
    private chatFunction;

    private constructor() {
        const functions = getFunctions(app);
        this.chatFunction = httpsCallable(functions, "chatWithOpenAI");
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    public async generateResponse(message: string): Promise<string> {
        try {
            const response = (await this.chatFunction({
                userMessage: message,
            })) as ChatResponse;

            return (
                response.data.output_text || "I couldn't process that message."
            );
        } catch (error) {
            console.error("Error in AI response:", error);
            throw error;
        }
    }
}

export default AIService;
