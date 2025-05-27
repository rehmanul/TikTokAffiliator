import { useState } from 'react';
import { generateAIContent } from '../lib/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from './ui';

interface AIContentGeneratorProps {
  onContentGenerated: (content: string) => void;
}

const AIContentGenerator = ({ onContentGenerated }: AIContentGeneratorProps) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setError(null);
      setGenerating(true);
      
      // Create a TikTok-specific prompt
      const tiktokPrompt = `Create a friendly, persuasive message for TikTok creators to join my affiliate program. 
      The message should be brief (max 250 characters), engaging, and mention the benefits of joining.
      Based on this context: ${prompt}`;
      
      const content = await generateAIContent(tiktokPrompt);
      setGeneratedContent(content);
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error('Error generating content:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleUseContent = () => {
    if (generatedContent) {
      onContentGenerated(generatedContent);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-800">AI Message Generator</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
              What would you like to communicate to creators?
            </Label>
            <Textarea
              id="prompt"
              placeholder="e.g., I'm looking for beauty influencers to promote my new skincare line with a 15% commission..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-24"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <Button
            onClick={handleGenerateContent}
            disabled={generating || !prompt.trim()}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {generating ? 'Generating...' : 'Generate Message'}
          </Button>

          {generatedContent && (
            <div className="mt-4 space-y-3">
              <Label className="block text-sm font-medium text-gray-700">Generated Message:</Label>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm">{generatedContent}</p>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleUseContent} 
                  className="bg-tiktok-teal hover:bg-tiktok-teal/90 text-white"
                >
                  Use This Message
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIContentGenerator;
