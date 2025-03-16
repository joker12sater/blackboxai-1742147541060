const OpenAI = require('openai');
const Festival = require('../models/Festival');
const Confession = require('../models/Confession');

class AIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.context = {
            festivalInfo: null,
            recentConfessions: [],
            popularTopics: new Map()
        };
    }

    // Initialize or update AI context
    async updateContext() {
        try {
            // Get latest festival information
            const festival = await Festival.findOne()
                .select('name description date location analytics')
                .lean();

            // Get recent confessions
            const recentConfessions = await Confession.find({
                moderationStatus: 'approved'
            })
            .sort('-createdAt')
            .limit(10)
            .lean();

            // Update context
            this.context.festivalInfo = festival;
            this.context.recentConfessions = recentConfessions;

            // Update popular topics
            this.updatePopularTopics(recentConfessions);
        } catch (error) {
            console.error('Context Update Error:', error);
            throw new Error('Failed to update AI context');
        }
    }

    // Generate festival gossip
    async generateGossip(userQuery = null) {
        try {
            await this.updateContext();

            const prompt = this.constructPrompt(userQuery);
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are the WhisperNet Heritage Festival's AI Gossip Bot. 
                        Your role is to provide engaging, culturally appropriate, and fun insights 
                        about the festival while maintaining community guidelines and respect for 
                        Kenyan culture. Always be positive and uplifting.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            });

            const gossip = response.choices[0].message.content;
            await this.trackGossipGeneration(gossip, userQuery);

            return {
                gossip,
                topics: Array.from(this.context.popularTopics.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
            };
        } catch (error) {
            console.error('Gossip Generation Error:', error);
            throw new Error('Failed to generate festival gossip');
        }
    }

    // Generate personalized recommendations
    async generateRecommendations(userId) {
        try {
            const userPreferences = await this.getUserPreferences(userId);
            const prompt = this.constructRecommendationPrompt(userPreferences);

            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are a cultural recommendation expert for the 
                        WhisperNet Heritage Festival. Provide personalized suggestions 
                        based on user preferences and festival offerings.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 200
            });

            return {
                recommendations: response.choices[0].message.content,
                basedOn: userPreferences
            };
        } catch (error) {
            console.error('Recommendations Generation Error:', error);
            throw new Error('Failed to generate recommendations');
        }
    }

    // Moderate content
    async moderateContent(text) {
        try {
            const response = await this.openai.moderations.create({
                input: text
            });

            const moderation = response.results[0];
            
            return {
                isAppropriate: !moderation.flagged,
                categories: moderation.categories,
                scores: moderation.category_scores
            };
        } catch (error) {
            console.error('Content Moderation Error:', error);
            throw new Error('Failed to moderate content');
        }
    }

    // Generate cultural insights
    async generateCulturalInsights(topic) {
        try {
            const prompt = this.constructCulturalPrompt(topic);
            
            const response = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are a Kenyan cultural expert providing 
                        authentic insights about traditions, customs, and heritage. 
                        Share knowledge that is respectful, accurate, and engaging.`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.6,
                max_tokens: 300
            });

            return {
                insight: response.choices[0].message.content,
                topic
            };
        } catch (error) {
            console.error('Cultural Insights Generation Error:', error);
            throw new Error('Failed to generate cultural insights');
        }
    }

    // Private helper methods
    private async getUserPreferences(userId) {
        // Implement user preferences retrieval logic
        return {
            interests: ['music', 'food', 'art'],
            previousInteractions: ['dance-workshop', 'storytelling'],
            favoriteEvents: ['cultural-parade', 'food-festival']
        };
    }

    private updatePopularTopics(confessions) {
        this.context.popularTopics.clear();
        
        for (const confession of confessions) {
            const words = confession.text.toLowerCase().split(/\W+/);
            words.forEach(word => {
                if (word.length > 3) {
                    this.context.popularTopics.set(
                        word,
                        (this.context.popularTopics.get(word) || 0) + 1
                    );
                }
            });
        }
    }

    private constructPrompt(userQuery) {
        const festival = this.context.festivalInfo;
        const confessions = this.context.recentConfessions;

        return `
            Festival Context:
            ${festival.name} is happening from ${festival.date.start} to ${festival.date.end}
            at ${festival.location.address}.

            ${userQuery ? `User Query: ${userQuery}` : 'Generate an interesting festival update.'}

            Recent community discussions:
            ${confessions.map(c => c.text).join('\n')}

            Popular topics: ${Array.from(this.context.popularTopics.keys()).slice(0, 5).join(', ')}

            Please provide an engaging and culturally appropriate response about the festival.
        `;
    }

    private constructRecommendationPrompt(preferences) {
        return `
            Based on the following user preferences:
            Interests: ${preferences.interests.join(', ')}
            Previous activities: ${preferences.previousInteractions.join(', ')}
            Favorite events: ${preferences.favoriteEvents.join(', ')}

            Please recommend personalized festival activities and experiences.
        `;
    }

    private constructCulturalPrompt(topic) {
        return `
            Please provide authentic insights about the following aspect of Kenyan culture:
            ${topic}

            Include:
            - Historical context
            - Modern relevance
            - Cultural significance
            - Interesting facts
        `;
    }

    private async trackGossipGeneration(gossip, query) {
        try {
            // Implement analytics tracking logic here
            console.log('Tracking gossip generation:', {
                timestamp: new Date(),
                query,
                gossipLength: gossip.length
            });
        } catch (error) {
            console.error('Gossip Tracking Error:', error);
            // Non-critical operation, don't throw
        }
    }
}

// Export singleton instance
module.exports = new AIService();
