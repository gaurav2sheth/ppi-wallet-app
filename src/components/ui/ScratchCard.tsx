import { useState } from 'react';
import { useRewardsStore } from '../../store/rewards.store';
import { Button } from './Button';

export function ScratchCardOverlay() {
  const { pendingCard, scratchCard, dismissCard } = useRewardsStore();
  const [scratched, setScratched] = useState(false);

  if (!pendingCard) return null;

  const handleScratch = () => {
    setScratched(true);
    scratchCard(pendingCard.id);
    setTimeout(() => { dismissCard(); setScratched(false); }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl w-[300px] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-paytm-cyan to-blue-400 p-4 text-center">
          <p className="text-white text-xs font-medium">You earned a</p>
          <p className="text-white text-lg font-bold">Scratch Card! 🎉</p>
        </div>

        {/* Scratch Area */}
        <div className="p-6 text-center">
          {!scratched ? (
            <button
              onClick={handleScratch}
              className="w-48 h-28 mx-auto bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:from-gray-300 hover:to-gray-400 transition-all active:scale-95 border-2 border-dashed border-gray-400"
            >
              <div className="text-center">
                <p className="text-2xl">🎁</p>
                <p className="text-xs font-semibold text-gray-600 mt-1">Tap to scratch</p>
              </div>
            </button>
          ) : (
            <div className="w-48 h-28 mx-auto flex items-center justify-center animate-[fadeIn_0.3s_ease-out]">
              {pendingCard.amount > 0 ? (
                <div className="text-center">
                  <p className="text-3xl mb-1">🎊</p>
                  <p className="text-xl font-bold text-paytm-green">{pendingCard.label}</p>
                  <p className="text-[10px] text-paytm-muted mt-1">Added to your wallet</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-3xl mb-1">😊</p>
                  <p className="text-sm font-semibold text-paytm-muted">{pendingCard.label}</p>
                  <p className="text-[10px] text-paytm-muted mt-1">Keep transacting for rewards</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dismiss */}
        <div className="px-6 pb-4">
          <Button fullWidth size="sm" variant="ghost" onClick={() => { dismissCard(); setScratched(false); }}>
            {scratched ? 'Done' : 'Skip'}
          </Button>
        </div>
      </div>
    </div>
  );
}
