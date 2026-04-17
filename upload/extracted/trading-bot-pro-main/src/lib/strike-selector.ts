/**
 * Strike Selector - Automatic Strike Selection for Options
 * Automatically selects the best strike price for CALL/PUT options
 */

export interface StrikeSelectorConfig {
  mode: 'OFFSET' | 'CONTRACT_PRICE' | 'DELTA' | 'AUTO';
  contractPriceMin: number;
  contractPriceMax: number;
  strikeOffset: number; // Points from ATM for OFFSET mode
  targetDelta: number; // Target delta for DELTA mode
}

export interface StrikeData {
  strike: number;
  callPremium: number;
  putPremium: number;
  callDelta: number;
  putDelta: number;
  callVolume: number;
  putVolume: number;
  callOpenInterest: number;
  putOpenInterest: number;
  callSpread: number;
  putSpread: number;
  distanceFromATM: number;
}

export interface SelectedStrike {
  strike: number;
  premium: number;
  delta: number;
  reason: string;
  confidence: number;
  liquidity: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Default configuration
const DEFAULT_CONFIG: StrikeSelectorConfig = {
  mode: 'AUTO',
  contractPriceMin: 300,
  contractPriceMax: 400,
  strikeOffset: 5,
  targetDelta: 0.30
};

/**
 * Calculate ATM (At The Money) strike
 */
export function calculateATMStrike(spotPrice: number, strikeInterval: number = 5): number {
  return Math.round(spotPrice / strikeInterval) * strikeInterval;
}

/**
 * Generate simulated strike chain (in production, fetch from IB API)
 */
export function generateStrikeChain(
  spotPrice: number,
  numStrikes: number = 20,
  strikeInterval: number = 5
): StrikeData[] {
  const atmStrike = calculateATMStrike(spotPrice, strikeInterval);
  const strikes: StrikeData[] = [];

  for (let i = -numStrikes / 2; i <= numStrikes / 2; i++) {
    const strike = atmStrike + i * strikeInterval;
    const distanceFromATM = Math.abs(i);

    // Simulate premium (ATM is highest, decreases OTM)
    const basePremium = spotPrice * 0.06; // ~6% of spot price for ATM
    const callPremium = Math.max(5, basePremium * Math.exp(-distanceFromATM * 0.08) + (Math.random() - 0.5) * 10);
    const putPremium = Math.max(5, basePremium * Math.exp(-distanceFromATM * 0.08) + (Math.random() - 0.5) * 10);

    // Simulate delta
    const callDelta = Math.max(0.05, Math.min(0.95, 0.50 - i * 0.03 + (Math.random() - 0.5) * 0.05));
    const putDelta = Math.max(-0.95, Math.min(-0.05, -0.50 - i * 0.03 + (Math.random() - 0.5) * 0.05));

    // Simulate volume/OI (higher near ATM)
    const volumeFactor = Math.exp(-distanceFromATM * 0.1);
    const callVolume = Math.round(1000 * volumeFactor + Math.random() * 500);
    const putVolume = Math.round(1000 * volumeFactor + Math.random() * 500);
    const callOpenInterest = Math.round(5000 * volumeFactor + Math.random() * 2000);
    const putOpenInterest = Math.round(5000 * volumeFactor + Math.random() * 2000);

    // Simulate spread (wider OTM)
    const spreadFactor = 1 + distanceFromATM * 0.2;
    const callSpread = Math.round((1.5 + distanceFromATM * 0.3) * spreadFactor * 100) / 100;
    const putSpread = Math.round((1.5 + distanceFromATM * 0.3) * spreadFactor * 100) / 100;

    strikes.push({
      strike,
      callPremium: Math.round(callPremium * 100) / 100,
      putPremium: Math.round(putPremium * 100) / 100,
      callDelta: Math.round(callDelta * 100) / 100,
      putDelta: Math.round(putDelta * 100) / 100,
      callVolume,
      putVolume,
      callOpenInterest,
      putOpenInterest,
      callSpread,
      putSpread,
      distanceFromATM
    });
  }

  return strikes;
}

/**
 * Select best strike based on configuration
 */
export function selectBestStrike(
  spotPrice: number,
  direction: 'CALL' | 'PUT',
  config: StrikeSelectorConfig = DEFAULT_CONFIG
): SelectedStrike {
  const strikeChain = generateStrikeChain(spotPrice);
  const atmStrike = calculateATMStrike(spotPrice);

  let selectedStrike: StrikeData | null = null;
  let reason = '';
  let confidence = 70;

  switch (config.mode) {
    case 'OFFSET':
      // Fixed offset from ATM
      const offsetStrike = direction === 'CALL'
        ? atmStrike + config.strikeOffset
        : atmStrike - config.strikeOffset;

      selectedStrike = strikeChain.find(s => s.strike === offsetStrike) ||
                       strikeChain.reduce((prev, curr) =>
                         Math.abs(curr.strike - offsetStrike) < Math.abs(prev.strike - offsetStrike) ? curr : prev
                       );
      reason = `استرايك بفارق ${config.strikeOffset} نقاط من ATM`;
      confidence = 75;
      break;

    case 'CONTRACT_PRICE':
      // Select strike with premium in target range
      const premiumKey = direction === 'CALL' ? 'callPremium' : 'putPremium';
      const inRangeStrikes = strikeChain.filter(s =>
        s[premiumKey] >= config.contractPriceMin && s[premiumKey] <= config.contractPriceMax
      );

      if (inRangeStrikes.length > 0) {
        // Prefer closest to middle of range
        const targetMid = (config.contractPriceMin + config.contractPriceMax) / 2;
        selectedStrike = inRangeStrikes.reduce((prev, curr) =>
          Math.abs(curr[premiumKey] - targetMid) < Math.abs(prev[premiumKey] - targetMid) ? curr : prev
        );
        reason = `سعر العقد $${selectedStrike[premiumKey]} في النطاق المطلوب ($${config.contractPriceMin}-$${config.contractPriceMax})`;
        confidence = 80;
      } else {
        // Fallback to closest to range
        selectedStrike = strikeChain.reduce((prev, curr) =>
          Math.abs(curr[premiumKey] - config.contractPriceMin) < Math.abs(prev[premiumKey] - config.contractPriceMin) ? curr : prev
        );
        reason = `أقرب استرايك للنطاق المطلوب - سعر $${selectedStrike[premiumKey]}`;
        confidence = 60;
      }
      break;

    case 'DELTA':
      // Select strike with target delta
      const deltaKey = direction === 'CALL' ? 'callDelta' : 'putDelta';
      const targetDeltaAbs = Math.abs(config.targetDelta);

      selectedStrike = strikeChain.reduce((prev, curr) =>
        Math.abs(Math.abs(curr[deltaKey]) - targetDeltaAbs) < Math.abs(Math.abs(prev[deltaKey]) - targetDeltaAbs)
          ? curr : prev
      );
      reason = `دلتا ${Math.abs(selectedStrike[deltaKey]).toFixed(2)} قريبة من الهدف ${targetDeltaAbs}`;
      confidence = 85;
      break;

    case 'AUTO':
    default:
      // Smart selection combining multiple factors
      selectedStrike = selectBestStrikeAuto(strikeChain, direction, config);
      reason = selectedStrike.distanceFromATM === 0
        ? 'استرايك ATM - أفضل توازن بين المخاطرة والعائد'
        : direction === 'CALL'
          ? `استرايك OTM بـ ${selectedStrike.distanceFromATM} نقاط - جيد للصعود`
          : `استرايك OTM بـ ${selectedStrike.distanceFromATM} نقاط - جيد للهبوط`;
      confidence = calculateAutoConfidence(selectedStrike, direction, config);
      break;
  }

  if (!selectedStrike) {
    // Fallback to ATM
    selectedStrike = strikeChain.find(s => s.strike === atmStrike) || strikeChain[0];
    reason = 'ATM (افتراضي)';
    confidence = 50;
  }

  const premium = direction === 'CALL' ? selectedStrike.callPremium : selectedStrike.putPremium;
  const delta = direction === 'CALL' ? selectedStrike.callDelta : selectedStrike.putDelta;
  const volume = direction === 'CALL' ? selectedStrike.callVolume : selectedStrike.putVolume;

  return {
    strike: selectedStrike.strike,
    premium,
    delta: Math.abs(delta),
    reason,
    confidence,
    liquidity: volume > 500 ? 'HIGH' : volume > 200 ? 'MEDIUM' : 'LOW'
  };
}

/**
 * Smart automatic strike selection
 */
function selectBestStrikeAuto(
  strikeChain: StrikeData[],
  direction: 'CALL' | 'PUT',
  config: StrikeSelectorConfig
): StrikeData {
  const premiumKey = direction === 'CALL' ? 'callPremium' : 'putPremium';
  const deltaKey = direction === 'CALL' ? 'callDelta' : 'putDelta';
  const volumeKey = direction === 'CALL' ? 'callVolume' : 'putVolume';
  const spreadKey = direction === 'CALL' ? 'callSpread' : 'putSpread';

  // Score each strike
  const scoredStrikes = strikeChain.map(strike => {
    let score = 0;

    // Premium score (prefer in target range)
    const premium = strike[premiumKey];
    if (premium >= config.contractPriceMin && premium <= config.contractPriceMax) {
      score += 30;
      // Bonus for being near middle of range
      const targetMid = (config.contractPriceMin + config.contractPriceMax) / 2;
      const premiumDistance = Math.abs(premium - targetMid) / targetMid;
      score += Math.max(0, 20 * (1 - premiumDistance));
    }

    // Liquidity score (higher volume = better)
    const volume = strike[volumeKey];
    if (volume > 1000) score += 20;
    else if (volume > 500) score += 15;
    else if (volume > 200) score += 10;

    // Spread score (lower spread = better)
    const spread = strike[spreadKey];
    if (spread < 2) score += 15;
    else if (spread < 3) score += 10;
    else if (spread < 5) score += 5;

    // Delta score (prefer moderate delta for directional trades)
    const delta = Math.abs(strike[deltaKey]);
    if (delta >= 0.25 && delta <= 0.45) score += 15;
    else if (delta >= 0.20 && delta <= 0.50) score += 10;

    // Distance from ATM (slight preference for slightly OTM)
    if (strike.distanceFromATM <= 3) score += 10;
    else if (strike.distanceFromATM <= 5) score += 5;

    return { strike, score };
  });

  // Sort by score descending
  scoredStrikes.sort((a, b) => b.score - a.score);

  return scoredStrikes[0].strike;
}

/**
 * Calculate confidence for AUTO mode selection
 */
function calculateAutoConfidence(
  strike: StrikeData,
  direction: 'CALL' | 'PUT',
  config: StrikeSelectorConfig
): number {
  let confidence = 70;

  const premium = direction === 'CALL' ? strike.callPremium : strike.putPremium;
  const volume = direction === 'CALL' ? strike.callVolume : strike.putVolume;
  const spread = direction === 'CALL' ? strike.callSpread : strike.putSpread;

  // Premium in range bonus
  if (premium >= config.contractPriceMin && premium <= config.contractPriceMax) {
    confidence += 10;
  }

  // Liquidity bonus
  if (volume > 1000) confidence += 10;
  if (spread < 2) confidence += 5;

  // ATM/OTM balance
  if (strike.distanceFromATM <= 3) confidence += 5;

  return Math.min(95, confidence);
}

/**
 * Get strike recommendation for display
 */
export function getStrikeRecommendation(
  spotPrice: number,
  direction: 'CALL' | 'PUT',
  config: StrikeSelectorConfig = DEFAULT_CONFIG
): {
  selected: SelectedStrike;
  alternatives: SelectedStrike[];
  analysis: string;
} {
  const selected = selectBestStrike(spotPrice, direction, config);
  const strikeChain = generateStrikeChain(spotPrice);

  // Get 2 alternative strikes
  const alternatives: SelectedStrike[] = [];
  const altOffsets = direction === 'CALL' ? [-5, 5] : [5, -5];

  for (const offset of altOffsets) {
    const altStrike = selected.strike + offset;
    const found = strikeChain.find(s => s.strike === altStrike);
    if (found) {
      const premium = direction === 'CALL' ? found.callPremium : found.putPremium;
      alternatives.push({
        strike: found.strike,
        premium,
        delta: Math.abs(direction === 'CALL' ? found.callDelta : found.putDelta),
        reason: `بديل ${offset > 0 ? 'أعلى' : 'أدنى'}`,
        confidence: selected.confidence - 10,
        liquidity: found.callVolume > 500 ? 'HIGH' : 'MEDIUM'
      });
    }
  }

  // Generate analysis text
  const analysis = generateStrikeAnalysis(selected, direction, spotPrice);

  return { selected, alternatives, analysis };
}

/**
 * Generate human-readable analysis
 */
function generateStrikeAnalysis(
  selected: SelectedStrike,
  direction: 'CALL' | 'PUT',
  spotPrice: number
): string {
  const directionText = direction === 'CALL' ? 'صعودي (CALL)' : 'هبوطي (PUT)';
  const moneyness = selected.strike > spotPrice ? 'OTM' :
                   selected.strike < spotPrice ? 'ITM' : 'ATM';

  return `الاسترايك المختار: ${selected.strike} (${moneyness})
الاتجاه: ${directionText}
السعر المتوقع: $${selected.premium.toFixed(2)}
الدلتا: ${selected.delta.toFixed(2)}
السيولة: ${selected.liquidity === 'HIGH' ? 'عالية' : selected.liquidity === 'MEDIUM' ? 'متوسطة' : 'منخفضة'}
الثقة: ${selected.confidence}%

السبب: ${selected.reason}`;
}

// Export singleton instance
export const strikeSelector = {
  selectBestStrike,
  getStrikeRecommendation,
  generateStrikeChain,
  calculateATMStrike
};
