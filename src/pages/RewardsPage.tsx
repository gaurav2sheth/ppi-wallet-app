import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { useRewardsStore } from '../store/rewards.store';
import { formatDate } from '../utils/format';

export function RewardsPage() {
  const { scratchCards, totalCashback } = useRewardsStore();

  const totalRupees = (totalCashback / 100).toFixed(totalCashback % 100 === 0 ? 0 : 2);
  const wonCards = scratchCards.filter(c => c.scratched && c.amount > 0);
  const missedCards = scratchCards.filter(c => c.scratched && c.amount === 0);
  const unscratchedCards = scratchCards.filter(c => !c.scratched);

  return (
    <div className="page-enter">
      <Header showBack title="Rewards & Cashback" />
      <div className="px-4 pt-4 space-y-4">

        {/* Total Cashback Balance */}
        <Card className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-center !rounded-2xl">
          <div className="py-3">
            <p className="text-xs font-medium text-white/80">Total Cashback Earned</p>
            <p className="text-4xl font-bold mt-1">₹{totalRupees}</p>
            <p className="text-[11px] text-white/70 mt-2">{wonCards.length} reward{wonCards.length !== 1 ? 's' : ''} won from {scratchCards.length} scratch card{scratchCards.length !== 1 ? 's' : ''}</p>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center !p-3">
            <p className="text-xl font-bold text-paytm-cyan">{scratchCards.length}</p>
            <p className="text-[10px] text-paytm-muted mt-0.5">Total Cards</p>
          </Card>
          <Card className="text-center !p-3">
            <p className="text-xl font-bold text-paytm-green">{wonCards.length}</p>
            <p className="text-[10px] text-paytm-muted mt-0.5">Won</p>
          </Card>
          <Card className="text-center !p-3">
            <p className="text-xl font-bold text-paytm-muted">{unscratchedCards.length}</p>
            <p className="text-[10px] text-paytm-muted mt-0.5">Unscratched</p>
          </Card>
        </div>

        {/* Unscratched Cards */}
        {unscratchedCards.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-paytm-muted mb-2 tracking-wide">PENDING SCRATCH CARDS</p>
            <div className="space-y-2">
              {unscratchedCards.map(card => (
                <Card key={card.id} className="!p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-lg">🎁</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-paytm-text">Scratch Card</p>
                      <p className="text-[10px] text-paytm-muted">{formatDate(card.createdAt)}</p>
                    </div>
                    <span className="text-xs font-semibold text-paytm-orange bg-orange-50 px-3 py-1 rounded-full">Unscratched</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cashback History */}
        <div>
          <p className="text-xs font-semibold text-paytm-muted mb-2 tracking-wide">CASHBACK HISTORY</p>
          {wonCards.length === 0 && missedCards.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-3xl mb-2">🎰</p>
              <p className="text-sm text-paytm-muted">No rewards yet</p>
              <p className="text-xs text-paytm-muted mt-1">Make transactions to earn scratch cards!</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {scratchCards.filter(c => c.scratched).map(card => (
                <Card key={card.id} className="!p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${card.amount > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
                      {card.amount > 0 ? '🎉' : '😊'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-paytm-text">{card.label}</p>
                      <p className="text-[10px] text-paytm-muted">{formatDate(card.createdAt)}</p>
                    </div>
                    {card.amount > 0 && (
                      <span className="text-sm font-bold text-paytm-green">
                        +₹{(card.amount / 100).toFixed(card.amount % 100 === 0 ? 0 : 2)}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <Card className="!p-3 bg-amber-50/50 border border-amber-100">
          <div className="flex gap-2">
            <span className="text-sm">💡</span>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Earn scratch cards on every wallet transaction. Cashback is credited directly to your wallet balance. Up to 10% cashback per transaction (max ₹200).
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
