import { Button } from "@/components/ui/button";
import { Smile, Frown, Zap, Wind, Heart, Coffee } from "lucide-react";

interface MoodSelectorProps {
	onSelectMood: (mood: string) => void;
	disabled?: boolean;
}

const moods = [
	{ label: "Happy", icon: Smile, prompt: "I want happy and upbeat songs" },
	{ label: "Sad", icon: Frown, prompt: "I'm feeling sad, recommend some emotional songs" },
	{ label: "Energetic", icon: Zap, prompt: "Give me high-energy workout songs" },
	{ label: "Calm", icon: Wind, prompt: "I need relaxing and calm music" },
	{ label: "Romantic", icon: Heart, prompt: "Recommend romantic love songs" },
	{ label: "Focus", icon: Coffee, prompt: "I need music to focus and study" },
];

const MoodSelector = ({ onSelectMood, disabled }: MoodSelectorProps) => {
	return (
		<div className='space-y-3'>
			<p className='text-sm text-zinc-400'>Quick mood selection:</p>
			<div className='grid grid-cols-3 gap-2'>
				{moods.map((mood) => {
					const Icon = mood.icon;
					return (
						<Button
							key={mood.label}
							variant='outline'
							size='sm'
							onClick={() => onSelectMood(mood.prompt)}
							disabled={disabled}
							className='flex items-center gap-2 bg-zinc-800/50 border-zinc-700 hover:bg-zinc-700 hover:border-emerald-500 transition-all'
						>
							<Icon className='size-4' />
							<span className='text-xs'>{mood.label}</span>
						</Button>
					);
				})}
			</div>
		</div>
	);
};

export default MoodSelector;
