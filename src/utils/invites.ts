import { Linking, Platform, Share } from 'react-native';

export interface SendInviteParams {
  contact: string; // phone number or email
  senderName: string;
  listTitle?: string;
  inviteCode?: string;
}

export async function sendInviteMessage({ contact, senderName, listTitle, inviteCode }: SendInviteParams) {
  const isEmail = contact.includes('@');
  const appName = 'GroceryList';
  const code = inviteCode || Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const subject = listTitle
    ? `${senderName} invited you to collaborate on "${listTitle}"`
    : `${senderName} invited you to connect on ${appName}`;

  const body = listTitle
    ? `Hey! ${senderName} invited you to share the grocery list "${listTitle}" on ${appName}.\n\nJoin code: ${code}\nDownload the app to collaborate in real-time!`
    : `Hey! ${senderName} wants to be friends on ${appName} so you can share grocery lists and shop together.\n\nUse invite code: ${code} to connect!`;

  if (isEmail) {
    const mailUrl = `mailto:${contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const canOpen = await Linking.canOpenURL(mailUrl).catch(() => false);
    if (canOpen) {
      await Linking.openURL(mailUrl);
      return { success: true, method: 'email', code };
    }
  } else {
    // Clean phone number
    const cleanedNumber = contact.replace(/[^\d+]/g, '');
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const smsUrl = `sms:${cleanedNumber}${separator}body=${encodeURIComponent(body)}`;
    const canOpen = await Linking.canOpenURL(smsUrl).catch(() => false);
    if (canOpen) {
      await Linking.openURL(smsUrl);
      return { success: true, method: 'sms', code };
    }
  }

  // Fallback to native system Share dialog
  try {
    await Share.share({
      title: subject,
      message: `${body}\n\nContact: ${contact}`,
    });
    return { success: true, method: 'share_sheet', code };
  } catch (error) {
    console.warn('Share sheet failed:', error);
    return { success: false, method: 'none', code };
  }
}
