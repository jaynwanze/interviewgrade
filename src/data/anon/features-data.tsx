import { AnimatedBeamMultiple } from '@/components/animated-beam-multiple';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

export const featuresData = [
  {
    name: 'Realistic Mock Interviews',
    description:
      'Practice behavioral and technical questions with our virtual interviewer named Avery. No scheduling, unlimited retries!',
    background: (
      <Command
        value="0"
        className="absolute -right-5 top-10 w-[70%] origin-top translate-x-0 border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:-translate-x-10"
      >
        <CommandInput
          className="border-none focus:ring-0"
          placeholder="Answer in your own words…"
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup
            heading="Sample questions"
            className="pointer-events-none"
          >
            <CommandItem>“Tell me about yourself”</CommandItem>
            <CommandItem>“Describe a conflict you resolved”</CommandItem>
            <CommandItem>“Where do you see yourself in 5 years?”</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    ),
  },
  {
    name: 'Instant AI Grading & Feedback',
    description:
      'Receive rubric-based scores, visual skill comparisions and actionable improvement tips seconds after each answer.',
    background: (
      <AnimatedBeamMultiple className="absolute right-2 top-4 h-full pt-0 border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-105" />
    ),
  },
  {
    name: 'Skill Progress Dashboard',
    description:
      'Track your growth with radar charts, weekly trends, and peer benchmarks. Switch between Practice and Interview modes.',
    background: (
      <Calendar
        mode="single"
        selected={new Date()}
        className="absolute right-0 top-10 origin-top rounded-md border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105"
      />
    ),
  },
  {
    name: 'AI Coach Chat',
    description:
      'Ask follow-up questions and get personalized strategy advice from your always-on AI interview coach.',
    background: (
      <div className="absolute -right-5 top-10 w-[70%] origin-top border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:-translate-x-10 bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 w-8 h-8 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
            AI
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm max-w-[70%]">
            Hi! I’m your virtual interviewer. Do you want any advice?
          </div>
        </div>
        <div className="flex items-start gap-2 self-end">
          <div className="bg-blue-500 text-white rounded-lg px-3 py-2 text-sm max-w-[70%]">
            Yes, let’s go!
          </div>
          <div className="rounded-full bg-gray-200 dark:bg-gray-700 w-8 h-8 flex items-center justify-center font-bold text-gray-700 dark:text-gray-300">
            You
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 w-8 h-8 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
            AI
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm max-w-[70%]">
            Tell me about yourself.
          </div>
        </div>
      </div>
    ),
  },
] as const;
