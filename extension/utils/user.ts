// Utility functions for the extension

export const generateExtensionUserId = async (): Promise<string> => {
  // Try to get existing userId from storage
  try {
    const result = await chrome.storage.local.get(['extensionUserId']);
    if (result.extensionUserId) {
      return result.extensionUserId;
    }
  } catch (error) {
    console.warn('Could not access chrome storage:', error);
  }

  // Generate new userId
  const userId = `ext_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Save to storage for future use
  try {
    await chrome.storage.local.set({ extensionUserId: userId });
  } catch (error) {
    console.warn('Could not save userId to storage:', error);
  }
  
  return userId;
};

export const getExtensionUserId = (): string => {
  // Fallback for when chrome storage is not available
  return `ext_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
