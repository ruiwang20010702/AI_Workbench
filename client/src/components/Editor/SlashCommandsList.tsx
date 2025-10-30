import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { SlashCommand } from './SlashCommands';

interface SlashCommandsListProps {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
}

export interface SlashCommandsListRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export const SlashCommandsList = forwardRef<SlashCommandsListRef, SlashCommandsListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[280px] max-h-[400px] overflow-y-auto">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            key={index}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              index === selectedIndex
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => selectItem(index)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm font-medium">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{item.title}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            </div>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-gray-500 text-sm">没有找到匹配的命令</div>
      )}
    </div>
  );
});