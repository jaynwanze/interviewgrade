'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

// Mock “conversations” data
const mockConversations = [
  {
    conversationId: 'conv1',
    candidateId: 'c1',
    candidateName: 'Alice Anderson',
    avatar_url: '/images/mock_avatar_f_1.jpg',
    lastMessageSnippet: "Sure, let's chat about the role...",
    messages: [
      {
        id: 'm1',
        sender_id: 'c1',
        body: "Hi, I'd like to discuss the position further!",
        created_at: '2025-02-22T10:00:00Z',
      },
      {
        id: 'm2',
        sender_id: 'emp123', // You (the Employer)
        body: 'Certainly. Could you share your CV?',
        created_at: '2025-02-22T10:01:00Z',
      },
    ],
  },
  {
    conversationId: 'conv2',
    candidateId: 'c2',
    candidateName: 'Bob Brown',
    avatar_url: '/images/mock_avatar_m_2.jpg',
    lastMessageSnippet: "Thanks for the info, I'll get back to you soon.",
    messages: [
      {
        id: 'm1',
        sender_id: 'emp123',
        body: 'Hey Bob, checking in about the front-end developer role.',
        created_at: '2025-02-22T09:50:00Z',
      },
      {
        id: 'm2',
        sender_id: 'c2',
        body: "Thanks for the info, I'll get back to you soon.",
        created_at: '2025-02-22T09:55:00Z',
      },
    ],
  },
];

// Mock “search candidates” data for new conversation
const mockAllCandidates = [
  {
    id: 'c1',
    full_name: 'Alice Anderson',
    avatar_url: '/images/mock_avatar_f_1.jpg',
  },
  {
    id: 'c2',
    full_name: 'Bob Brown',
    avatar_url: '/images/mock_avatar_m_2.jpg',
  },
  {
    id: 'c3',
    full_name: 'Charlie Davis',
    avatar_url: '/images/mock_avatar_m_3.jpg',
  },
  {
    id: 'c4',
    full_name: 'Diana Evans',
    avatar_url: '/images/mock_avatar_f_4.jpg',
  },
];

export default function MessagesPage() {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConv, setActiveConv] = useState<string | null>(null);

  // This is the conversation the user currently sees on the right side
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeConversation, setActiveConversation] = useState<any>(null);

  // The message text in the composer
  const [newMessage, setNewMessage] = useState('');

  // Searching for existing conversations
  const [searchText, setSearchText] = useState('');

  // Searching for new user (candidate) to create conversation
  const [newUserSearch, setNewUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState(mockAllCandidates);

  // 1) Filter the left sidebar conversations by searchText
  const filteredConversations = conversations.filter((conv) => {
    return (
      conv.candidateName.toLowerCase().includes(searchText.toLowerCase()) ||
      conv.lastMessageSnippet.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  // 2) On mount or when activeConv changes, find the conversation object
  useEffect(() => {
    if (!activeConv) {
      setActiveConversation(null);
      return;
    }
    const found = conversations.find((c) => c.conversationId === activeConv);
    setActiveConversation(found || null);
  }, [activeConv, conversations]);

  // 3) Searching for new user to create conversation
  useEffect(() => {
    // Filter from mockAllCandidates
    const results = mockAllCandidates.filter((c) =>
      c.full_name.toLowerCase().includes(newUserSearch.toLowerCase()),
    );
    setSearchResults(results);
  }, [newUserSearch]);

  // Mock function to create a conversation
  function createConversation(candidateId: string) {
    // Check if we already have a conversation
    const existing = conversations.find(
      (conv) => conv.candidateId === candidateId,
    );
    if (existing) {
      setActiveConv(existing.conversationId);
      return;
    }
    // Otherwise create a new one
    const candidate = mockAllCandidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    const newConv = {
      conversationId: 'conv' + Date.now(),
      candidateId: candidate.id,
      candidateName: candidate.full_name,
      avatar_url: candidate.avatar_url,
      lastMessageSnippet: '',
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConv(newConv.conversationId);
    setNewUserSearch('');
  }

  // 4) Sending a message
  function handleSend() {
    if (!newMessage.trim() || !activeConversation) return;
    const now = new Date().toISOString();

    const newMsg = {
      id: 'm' + Date.now(),
      sender_id: 'emp123', // You
      body: newMessage,
      created_at: now,
    };

    // Update that conversation’s messages
    const updatedConversations = conversations.map((conv) => {
      if (conv.conversationId === activeConversation.conversationId) {
        const updated = {
          ...conv,
          messages: [...conv.messages, newMsg],
          lastMessageSnippet: newMessage.slice(0, 50),
        };
        return updated;
      }
      return conv;
    });
    setConversations(updatedConversations);
    setNewMessage('');
  }

  return (
    <div className="flex h-[600px] border rounded-md overflow-hidden">
      {/* LEFT SIDEBAR - LIST OF CONVERSATIONS & "New Chat" */}
      <div className="w-1/3 border-r p-3 flex flex-col">
        <h2 className="font-bold text-lg mb-2">Conversations</h2>

        {/* Search existing convos */}
        <div className="relative mb-2">
          <SearchIcon className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-8"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Scrollable List */}
        <ScrollArea className="flex-1 mt-2">
          {filteredConversations.map((conv) => (
            <button
              key={conv.conversationId}
              onClick={() => setActiveConv(conv.conversationId)}
              className={`w-full text-left px-2 py-2 hover:bg-secondary rounded ${
                activeConv === conv.conversationId ? 'bg-secondary' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={conv.avatar_url} alt={conv.candidateName} />
                  <AvatarFallback>
                    {conv.candidateName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{conv.candidateName}</div>
                  <div className="text-xs text-muted-foreground">
                    {conv.lastMessageSnippet}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </ScrollArea>

        {/* Create New Conversation */}
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-1">Start new chat</h3>
          <Input
            placeholder="Search candidate..."
            value={newUserSearch}
            onChange={(e) => setNewUserSearch(e.target.value)}
          />
          <ScrollArea className="max-h-32 mt-2">
            {newUserSearch &&
              searchResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => createConversation(c.id)}
                  className="block w-full text-left px-2 py-1 hover:bg-secondary rounded"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={c.avatar_url} alt={c.full_name} />
                      <AvatarFallback>
                        {c.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{c.full_name}</span>
                  </div>
                </button>
              ))}
          </ScrollArea>
        </div>
      </div>

      {/* RIGHT PANEL - MESSAGES */}
      <div className="w-2/3 flex flex-col">
        {!activeConversation ? (
          <div className="p-6 text-sm text-center text-muted-foreground m-auto">
            Select or create a conversation to start chatting.
          </div>
        ) : (
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>{activeConversation.candidateName}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-2 border-t pt-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
              {activeConversation.messages.map((msg: any) => {
                const isYou = msg.sender_id === 'emp123';
                const timeStr = new Date(msg.created_at).toLocaleTimeString();

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isYou ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`px-3 py-2 rounded-md max-w-[70%] text-sm ${
                        isYou
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {msg.body}
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      {isYou ? 'You' : activeConversation.candidateName}{' '}
                      &middot; {timeStr}
                    </span>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="space-x-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
              />
              <Button onClick={handleSend}>Send</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
