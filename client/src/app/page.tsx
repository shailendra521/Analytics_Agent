"use client"

import Header from '@/components/Header';
import InputBar from '@/components/InputBar';
import MessageArea from '@/components/MessageArea';
import React, { useState } from 'react';

interface SearchInfo {
  stages: string[];
  query: string;
  urls: string[];
  error?: string;
}

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  type: string;
  isLoading?: boolean;
  searchInfo?: SearchInfo;
  progress?: string;
}

interface SearchData {
  stages: string[];
  query: string;
  urls: string[];
  error?: string;
}

interface SQLQueryData {
  is_read_query?: boolean;
  node?: string;
  relevant_tables?: string[];
  relevant_columns?: string[];
  columns_relations?: string[];
  summary?: string;
  conversation?: string[];
  sql_query?: string;
  query_result?: string;
  type_of_output?: string;
  plot_type?: string;
  final_answer?: string;
  status?: string;
}

interface EventData {
  type: 'checkpoint' | 'content' | 'search_start' | 'search_results' | 'search_error' | 'end';
  content?: string;
  checkpoint_id?: string;
  query?: string;
  urls?: string[] | string;
  error?: string;
  node?: string;
  is_read_query?: boolean;
  relevant_tables?: string[];
  relevant_columns?: string[];
  columns_relations?: string[];
  summary?: string;
  conversation?: string[];
  sql_query?: string;
  query_result?: string;
  type_of_output?: string;
  plot_type?: string;
  final_answer?: string;
  status?: string;
}

const Home = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: 'Hi there, how can I help you?',
      isUser: false,
      type: 'message'
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [checkpointId, setCheckpointId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      // First add the user message to the chat
      const newMessageId = messages.length > 0 ? Math.max(...messages.map(msg => msg.id)) + 1 : 1;

      setMessages(prev => [
        ...prev,
        {
          id: newMessageId,
          content: currentMessage,
          isUser: true,
          type: 'message'
        }
      ]);

      const userInput = currentMessage;
      setCurrentMessage(""); // Clear input field immediately

      try {
        // Create AI response placeholder
        const aiResponseId = newMessageId + 1;
        let hasFinalAnswer = false;

        setMessages(prev => [
          ...prev,
          {
            id: aiResponseId,
            content: "",
            isUser: false,
            type: 'message',
            isLoading: true,
            searchInfo: {
              stages: [],
              query: "",
              urls: []
            }
          }
        ]);

        // Create URL with checkpoint ID if it exists
        let url = `http://localhost:8000/stream?query=${encodeURIComponent(userInput)}`;
        if (checkpointId) {
          url += `?checkpoint_id=${encodeURIComponent(checkpointId)}`;
        }

        // Connect to SSE endpoint using EventSource
        const eventSource = new EventSource(url);
        let streamedContent = "";
        let searchData: SearchData | null = null;
        let hasReceivedContent = false;

        // Process incoming messages
        eventSource.onmessage = (event) => {
          try {
            // Safely parse JSON and handle potential errors
            let data: EventData;
            try {
              data = JSON.parse(event.data);
            } catch (parseError) {
              console.error("Error parsing event data:", parseError);
              console.log("Raw event data:", event.data);
              return;
            }

            if (data.type === 'checkpoint' && data.checkpoint_id) {
              // Store the checkpoint ID for future requests
              setCheckpointId(data.checkpoint_id);
            }
            else if (data.node) {
              // Handle SQL query related data
              let progress = "";
              
              switch (data.node) {
                case 'query_checker':
                  progress = "Analyzing query...";
                  break;
                case 'select_relevant_tables':
                  progress = "Identifying relevant tables...";
                  break;
                case 'relevant_column':
                  progress = "Analyzing columns...";
                  break;
                case 'column_relations':
                  progress = "Checking relationships...";
                  break;
                case 'generate_sql_query_summary':
                  progress = "Generating query summary...";
                  break;
                case 'generate_sql_query':
                  progress = "Creating SQL query...";
                  break;
                case 'filter_query':
                  progress = "Optimizing query...";
                  break;
                case 'execute_query':
                  progress = "Executing query...";
                  break;
                case 'select_type_output':
                  progress = "Processing results...";
                  break;
                case 'aggregate_result':
                  if (data.final_answer) {
                    hasFinalAnswer = true;
                    // Show the final answer
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === aiResponseId
                          ? { ...msg, content: data.final_answer!, isLoading: false }
                          : msg
                      )
                    );
                  }
                  break;
              }

              if (progress) {
                // Update message with progress
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiResponseId
                      ? { ...msg, progress: progress, isLoading: true }
                      : msg
                  )
                );
              }

              // If status is complete, ensure loading is finished
              if (data.status === 'complete') {
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiResponseId
                      ? { ...msg, isLoading: false }
                      : msg
                  )
                );
                eventSource.close();
              }
            }
            else if (data.type === 'search_start' && data.query) {
              // Create search info with 'searching' stage
              const newSearchInfo: SearchInfo = {
                stages: ['searching'],
                query: data.query,
                urls: []
              };
              searchData = newSearchInfo;

              // Update the AI message with search info
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiResponseId
                    ? { ...msg, searchInfo: newSearchInfo, isLoading: false }
                    : msg
                )
              );
            }
            else if (data.type === 'search_results') {
              try {
                // Parse URLs from search results
                const urls = typeof data.urls === 'string' ? JSON.parse(data.urls) : (data.urls || []);

                // Update search info to add 'reading' stage (don't replace 'searching')
                const newSearchInfo: SearchInfo = {
                  stages: searchData ? [...searchData.stages, 'reading'] : ['reading'],
                  query: searchData?.query || "",
                  urls: urls
                };
                searchData = newSearchInfo;

                // Update the AI message with search info
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiResponseId
                      ? { ...msg, searchInfo: newSearchInfo, isLoading: false }
                      : msg
                  )
                );
              } catch (err) {
                console.error("Error parsing search results:", err);
              }
            }
            else if (data.type === 'search_error') {
              // Handle search error
              const newSearchInfo: SearchInfo = {
                stages: searchData ? [...searchData.stages, 'error'] : ['error'],
                query: searchData?.query || "",
                error: data.error,
                urls: []
              };
              searchData = newSearchInfo;

              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiResponseId
                    ? { ...msg, searchInfo: newSearchInfo, isLoading: false }
                    : msg
                )
              );
            }
            else if (data.type === 'end') {
              // When stream ends, add 'writing' stage if we had search info
              if (searchData) {
                const finalSearchInfo: SearchInfo = {
                  ...searchData,
                  stages: [...searchData.stages, 'writing']
                };

                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiResponseId
                      ? { ...msg, searchInfo: finalSearchInfo, isLoading: false }
                      : msg
                  )
                );
              }

              eventSource.close();
            }
          } catch (error) {
            console.error("Error processing event:", error);
          }
        };

        // Handle errors
        eventSource.onerror = (event: Event) => {
          console.error("EventSource error occurred");
          eventSource.close();

          // Only update with error if we don't have any content and no final answer has been received
          if (!streamedContent && !hasFinalAnswer) {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === aiResponseId
                  ? { ...msg, content: "Sorry, there was an error processing your request.", isLoading: false }
                  : msg
              )
            );
          }
        };

        // Listen for end event
        eventSource.addEventListener('end', () => {
          eventSource.close();
        });
      } catch (error) {
        console.error("Error setting up EventSource:", error);
        setMessages(prev => [
          ...prev,
          {
            id: newMessageId + 1,
            content: "Sorry, there was an error connecting to the server.",
            isUser: false,
            type: 'message',
            isLoading: false
          }
        ]);
      }
    }
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen py-8 px-4">
      {/* Main container with refined shadow and border */}
      <div className="w-[70%] bg-white flex flex-col rounded-xl shadow-lg border border-gray-100 overflow-hidden h-[90vh]">
        <Header />
        <MessageArea messages={messages} />
        <InputBar currentMessage={currentMessage} setCurrentMessage={setCurrentMessage} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default Home;