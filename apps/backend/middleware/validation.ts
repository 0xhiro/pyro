import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';

export const validateBurnBody = (req: Request, res: Response, next: NextFunction) => {
  const { creatorMint, wallet, amount, advertisingMetadata, userId, promotedTokenMint } = req.body;

  if (!creatorMint || typeof creatorMint !== 'string') {
    return res.status(400).json({ error: 'creatorMint is required and must be a string' });
  }

  if (!wallet || typeof wallet !== 'string') {
    return res.status(400).json({ error: 'wallet is required and must be a string' });
  }

  if (amount === undefined || amount === null) {
    return res.status(400).json({ error: 'amount is required' });
  }

  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  // Validate optional advertising metadata
  if (advertisingMetadata !== undefined && advertisingMetadata !== null) {
    if (typeof advertisingMetadata !== 'object') {
      return res.status(400).json({ error: 'advertisingMetadata must be an object' });
    }
    
    const { message, websiteUrl, imageUrl, contact } = advertisingMetadata;
    
    if (message !== undefined && typeof message !== 'string') {
      return res.status(400).json({ error: 'advertisingMetadata.message must be a string' });
    }
    
    if (websiteUrl !== undefined && typeof websiteUrl !== 'string') {
      return res.status(400).json({ error: 'advertisingMetadata.websiteUrl must be a string' });
    }
    
    if (imageUrl !== undefined && typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'advertisingMetadata.imageUrl must be a string' });
    }
    
    if (contact !== undefined && typeof contact !== 'string') {
      return res.status(400).json({ error: 'advertisingMetadata.contact must be a string' });
    }
  }

  // Validate optional user fields
  if (userId !== undefined && userId !== null && typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId must be a string' });
  }

  if (promotedTokenMint !== undefined && promotedTokenMint !== null && typeof promotedTokenMint !== 'string') {
    return res.status(400).json({ error: 'promotedTokenMint must be a string' });
  }

  // Add parsed amount to request
  req.body.amount = numAmount;
  next();
};

export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: `Invalid ${paramName} format` });
    }
    next();
  };
};

export const validateCreatorBody = (req: Request, res: Response, next: NextFunction) => {
  const { mint, name, marketCap } = req.body;

  if (!mint || typeof mint !== 'string') {
    return res.status(400).json({ error: 'mint is required and must be a string' });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required and must be a string' });
  }

  // Validate optional marketCap if provided
  if (marketCap !== undefined && marketCap !== null) {
    const numMarketCap = Number(marketCap);
    if (!Number.isFinite(numMarketCap) || numMarketCap < 0) {
      return res.status(400).json({ error: 'marketCap must be a non-negative number' });
    }
    req.body.marketCap = numMarketCap;
  }

  next();
};

export const validateCreatorUpdateBody = (req: Request, res: Response, next: NextFunction) => {
  const { marketCap } = req.body;

  // Validate optional marketCap if provided
  if (marketCap !== undefined && marketCap !== null) {
    const numMarketCap = Number(marketCap);
    if (!Number.isFinite(numMarketCap) || numMarketCap < 0) {
      return res.status(400).json({ error: 'marketCap must be a non-negative number' });
    }
    req.body.marketCap = numMarketCap;
  }

  next();
};

export const validateSessionStart = (req: Request, res: Response, next: NextFunction) => {
  const { creatorMint } = req.body;

  if (!creatorMint || typeof creatorMint !== 'string') {
    return res.status(400).json({ error: 'creatorMint is required and must be a string' });
  }

  next();
};

// User validation functions
export const validateUserCreation = (req: Request, res: Response, next: NextFunction) => {
  const { wallet, username, displayName, bio, profileImageUrl, websiteUrl, twitterHandle, telegramHandle, discordHandle } = req.body;

  if (!wallet || typeof wallet !== 'string') {
    return res.status(400).json({ error: 'wallet is required and must be a string' });
  }

  if (username !== undefined && (typeof username !== 'string' || username.length < 3 || username.length > 30)) {
    return res.status(400).json({ error: 'username must be a string between 3 and 30 characters' });
  }

  if (displayName !== undefined && (typeof displayName !== 'string' || displayName.length > 100)) {
    return res.status(400).json({ error: 'displayName must be a string with max 100 characters' });
  }

  if (bio !== undefined && (typeof bio !== 'string' || bio.length > 500)) {
    return res.status(400).json({ error: 'bio must be a string with max 500 characters' });
  }

  if (profileImageUrl !== undefined && typeof profileImageUrl !== 'string') {
    return res.status(400).json({ error: 'profileImageUrl must be a string' });
  }

  if (websiteUrl !== undefined && typeof websiteUrl !== 'string') {
    return res.status(400).json({ error: 'websiteUrl must be a string' });
  }

  if (twitterHandle !== undefined && typeof twitterHandle !== 'string') {
    return res.status(400).json({ error: 'twitterHandle must be a string' });
  }

  if (telegramHandle !== undefined && typeof telegramHandle !== 'string') {
    return res.status(400).json({ error: 'telegramHandle must be a string' });
  }

  if (discordHandle !== undefined && typeof discordHandle !== 'string') {
    return res.status(400).json({ error: 'discordHandle must be a string' });
  }

  next();
};

export const validateUserUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { username, displayName, bio, profileImageUrl, websiteUrl, twitterHandle, telegramHandle, discordHandle, isPublic, allowDirectMessages } = req.body;

  if (username !== undefined && (typeof username !== 'string' || username.length < 3 || username.length > 30)) {
    return res.status(400).json({ error: 'username must be a string between 3 and 30 characters' });
  }

  if (displayName !== undefined && (typeof displayName !== 'string' || displayName.length > 100)) {
    return res.status(400).json({ error: 'displayName must be a string with max 100 characters' });
  }

  if (bio !== undefined && (typeof bio !== 'string' || bio.length > 500)) {
    return res.status(400).json({ error: 'bio must be a string with max 500 characters' });
  }

  if (profileImageUrl !== undefined && typeof profileImageUrl !== 'string') {
    return res.status(400).json({ error: 'profileImageUrl must be a string' });
  }

  if (websiteUrl !== undefined && typeof websiteUrl !== 'string') {
    return res.status(400).json({ error: 'websiteUrl must be a string' });
  }

  if (twitterHandle !== undefined && typeof twitterHandle !== 'string') {
    return res.status(400).json({ error: 'twitterHandle must be a string' });
  }

  if (telegramHandle !== undefined && typeof telegramHandle !== 'string') {
    return res.status(400).json({ error: 'telegramHandle must be a string' });
  }

  if (discordHandle !== undefined && typeof discordHandle !== 'string') {
    return res.status(400).json({ error: 'discordHandle must be a string' });
  }

  if (isPublic !== undefined && typeof isPublic !== 'boolean') {
    return res.status(400).json({ error: 'isPublic must be a boolean' });
  }

  if (allowDirectMessages !== undefined && typeof allowDirectMessages !== 'boolean') {
    return res.status(400).json({ error: 'allowDirectMessages must be a boolean' });
  }

  next();
};

export const validateTokenAddition = (req: Request, res: Response, next: NextFunction) => {
  const { mint, name, symbol, iconUrl, decimals, ticker, marketCap, dexUrl, websiteUrl, description } = req.body;

  if (!mint || typeof mint !== 'string') {
    return res.status(400).json({ error: 'mint is required and must be a string' });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required and must be a string' });
  }

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'symbol is required and must be a string' });
  }

  if (typeof decimals !== 'number' || decimals < 0 || decimals > 18) {
    return res.status(400).json({ error: 'decimals must be a number between 0 and 18' });
  }

  if (iconUrl !== undefined && typeof iconUrl !== 'string') {
    return res.status(400).json({ error: 'iconUrl must be a string' });
  }

  if (ticker !== undefined && typeof ticker !== 'string') {
    return res.status(400).json({ error: 'ticker must be a string' });
  }

  if (marketCap !== undefined && (typeof marketCap !== 'number' || marketCap < 0)) {
    return res.status(400).json({ error: 'marketCap must be a non-negative number' });
  }

  if (dexUrl !== undefined && typeof dexUrl !== 'string') {
    return res.status(400).json({ error: 'dexUrl must be a string' });
  }

  if (websiteUrl !== undefined && typeof websiteUrl !== 'string') {
    return res.status(400).json({ error: 'websiteUrl must be a string' });
  }

  if (description !== undefined && (typeof description !== 'string' || description.length > 1000)) {
    return res.status(400).json({ error: 'description must be a string with max 1000 characters' });
  }

  next();
};

export const validateTokenUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { name, symbol, iconUrl, ticker, marketCap, dexUrl, websiteUrl, description } = req.body;

  if (name !== undefined && typeof name !== 'string') {
    return res.status(400).json({ error: 'name must be a string' });
  }

  if (symbol !== undefined && typeof symbol !== 'string') {
    return res.status(400).json({ error: 'symbol must be a string' });
  }

  if (iconUrl !== undefined && typeof iconUrl !== 'string') {
    return res.status(400).json({ error: 'iconUrl must be a string' });
  }

  if (ticker !== undefined && typeof ticker !== 'string') {
    return res.status(400).json({ error: 'ticker must be a string' });
  }

  if (marketCap !== undefined && (typeof marketCap !== 'number' || marketCap < 0)) {
    return res.status(400).json({ error: 'marketCap must be a non-negative number' });
  }

  if (dexUrl !== undefined && typeof dexUrl !== 'string') {
    return res.status(400).json({ error: 'dexUrl must be a string' });
  }

  if (websiteUrl !== undefined && typeof websiteUrl !== 'string') {
    return res.status(400).json({ error: 'websiteUrl must be a string' });
  }

  if (description !== undefined && (typeof description !== 'string' || description.length > 1000)) {
    return res.status(400).json({ error: 'description must be a string with max 1000 characters' });
  }

  next();
};