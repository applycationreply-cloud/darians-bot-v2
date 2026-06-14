/**
 * Centralized Error Handling System
 * 
 * This module provides structured error handling for the TitanBot application.
 * 
 * PHILOSOPHY:
 * - All errors are categorized by type for consistent handling
 * - User-facing errors display friendly messages
 * - System errors are logged with full context
 * - Errors contain context information for debugging
 * 
 * USAGE:
 * - Throw TitanBotError for application-specific errors
 * - Use handleInteractionError for interaction errors
 * - Errors are automatically formatted and sent to user
 * 
 * ERROR TYPES:
 * - VALIDATION: Invalid user input
 * - PERMISSION: Missing access permissions
 * - CONFIGURATION: Missing/invalid configuration
 * - DATABASE: Database operation failure
 * - NETWORK: Network/external service failure
 * - DISCORD_API: Discord API error
 * - USER_INPUT: User input processing error
 * - RATE_LIMIT: Rate limit exceeded
 * - UNKNOWN: Unclassified error
 */

import { logger } from './logger.js';
import { createEmbed } from './embeds.js';
import { MessageFlags } from 'discord.js';
import { getErrorMetadata, getDefaultErrorCodeByType, resolveErrorCode, ErrorCodes } from './errorRegistry.js';




export const ErrorTypes = {
    VALIDATION: 'validation',
    PERMISSION: 'permission',
    CONFIGURATION: 'configuration',
    DATABASE: 'database',
    NETWORK: 'network',
    DISCORD_API: 'discord_api',
    USER_INPUT: 'user_input',
    RATE_LIMIT: 'rate_limit',
    UNKNOWN: 'unknown'
};




export class TitanBotError extends Error {
    constructor(message, type = ErrorTypes.UNKNOWN, userMessage = null, context = {}) {
        super(message);
        this.name = 'TitanBotError';
        this.type = type;
        this.userMessage = userMessage;
        this.context = context;
        this.code = context?.errorCode || getDefaultErrorCodeByType(type);
        this.timestamp = new Date().toISOString();
    }
}




export function categorizeError(error) {
    if (error instanceof TitanBotError) {
        return error.type;
    }

    const message = error.message?.toLowerCase() || '';
    const code = error.code;

    if (code >= 10000 && code < 20000) {
        return ErrorTypes.DISCORD_API;
    }

    if (message.includes('rate limit') || code === 50001) {
        return ErrorTypes.RATE_LIMIT;
    }

    if (message.includes('permission') || message.includes('missing') || code === 50013) {
        return ErrorTypes.PERMISSION;
    }

    if (message.includes('database') || message.includes('connection') || message.includes('timeout')) {
        return ErrorTypes.DATABASE;
    }

    if (message.includes('network') || message.includes('fetch') || message.includes('enotconn')) {
        return ErrorTypes.NETWORK;
    }

    if (message.includes('config') || message.includes('not found') || message.includes('invalid')) {
        return ErrorTypes.CONFIGURATION;
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
        return ErrorTypes.VALIDATION;
    }

    return ErrorTypes.UNKNOWN;
}




const UserMessages = {
    [ErrorTypes.VALIDATION]: {
        default: "Überprüfe deine Eingabe und versuche es erneut.",
        missing_required: "Dir fehlen einige erforderliche Informationen. Überprüfe die Befehlsoptionen.",
        invalid_format: "Das von dir angegebene Format ist nicht korrekt. Versuche es erneut."
    },
    [ErrorTypes.PERMISSION]: {
        default: "Ich habe keine Berechtigung dafür. Überprüfe meine Server-Berechtigungen.",
        user_permission: "Du hast keine Berechtigung, diesen Befehl zu verwenden.",
        bot_permission: "Ich benötige zusätzliche Berechtigungen, um diese Aktion durchzuführen."
    },
    [ErrorTypes.CONFIGURATION]: {
        default: "Etwas ist nicht richtig konfiguriert. Bitte kontaktiere einen Administrator.",
        missing_config: "Diese Funktion wurde noch nicht eingerichtet. Bitte kontaktiere einen Administrator.",
        invalid_config: "Die Konfiguration ist ungültig. Bitte kontaktiere einen Administrator."
    },
    [ErrorTypes.DATABASE]: {
        default: "Ich habe Probleme mit meiner Datenbank. Versuche es in einem Moment erneut.",
        connection_failed: "Ich kann mich nicht mit meiner Datenbank verbinden. Versuche es später erneut.",
        timeout: "Der Vorgang hat zu lange gedauert. Versuche es erneut."
    },
    [ErrorTypes.NETWORK]: {
        default: "Ich habe Netzwerkprobleme. Versuche es in einem Moment erneut.",
        timeout: "Die Anfrage hat das Zeitlimit überschritten. Versuche es erneut.",
        unreachable: "Ich kann den Dienst gerade nicht erreichen. Versuche es später erneut."
    },
    [ErrorTypes.DISCORD_API]: {
        default: "Ich habe Probleme mit Discord. Versuche es in einem Moment erneut.",
        rate_limit: "Du machst das zu oft. Warte einen Moment und versuche es erneut.",
        forbidden: "Mir ist das nicht erlaubt. Überprüfe meine Berechtigungen."
    },
    [ErrorTypes.USER_INPUT]: {
        default: "Es gab ein Problem mit deiner Anfrage. Versuche es erneut.",
        invalid_user: "Ich konnte diesen Benutzer nicht finden. Überprüfe die Benutzererkennung oder ID.",
        invalid_channel: "Ich konnte diesen Kanal nicht finden. Überprüfe die Kanalerkennung oder ID."
    },
    [ErrorTypes.RATE_LIMIT]: {
        default: "Du machst das zu oft. Warte einen Moment und versuche es erneut.",
        command_cooldown: "Dieser Befehl ist auf Cooldown. Warte, bevor du ihn erneut verwendest.",
        global_rate_limit: "Discord begrenzt dich derzeit. Warte einen Moment."
    },
    [ErrorTypes.UNKNOWN]: {
        default: "Es ist etwas schief gelaufen. Versuche es in einem Moment erneut.",
        unexpected: "Es ist ein unerwarteter Fehler aufgetreten. Versuche es später erneut."
    }
};




export function getUserMessage(error, context = {}) {
    const type = categorizeError(error);
    const messages = UserMessages[type] || UserMessages[ErrorTypes.UNKNOWN];
    
    if (error.userMessage) {
        return error.userMessage;
    }

    if (context.subtype && messages[context.subtype]) {
        return messages[context.subtype];
    }

    return messages.default;
}




export async function handleInteractionError(interaction, error, context = {}) {
    const errorType = categorizeError(error);
    const userMessage = getUserMessage(error, context);
    const resolvedErrorCode = resolveErrorCode({ error, errorType, context });
    const errorMetadata = getErrorMetadata(resolvedErrorCode);
    const traceId = context.traceId || interaction?.traceContext?.traceId || interaction?.traceId || error?.context?.traceId;
    
    
    
    
    const isUserError = [
        ErrorTypes.VALIDATION,
        ErrorTypes.RATE_LIMIT,
        ErrorTypes.USER_INPUT,
        ErrorTypes.PERMISSION
    ].includes(errorType);
    const isExpectedError = Boolean(error?.context?.expected === true || error?.context?.suppressErrorLog === true);
    
    const logData = {
        event: 'interaction.error',
        errorCode: resolvedErrorCode,
        remediationHint: errorMetadata.remediation,
        severity: errorMetadata.severity,
        retryable: errorMetadata.retryable,
        error: error.message,
        type: errorType,
        traceId,
        guildId: interaction.guildId,
        userId: interaction.user.id,
        command: interaction.commandName || context.command,
        interaction: {
            type: interaction.type,
            commandName: interaction.commandName,
            customId: interaction.customId,
            userId: interaction.user.id,
            guildId: interaction.guildId,
            channelId: interaction.channelId
        },
        context
    };
    
    if (isUserError || isExpectedError) {
        if (errorType !== ErrorTypes.RATE_LIMIT) {
            logger.debug(`User Error [${errorType.toUpperCase()}]: ${error.message}`, logData);
        }
    } else {
        // System errors (database, network, etc.) - unexpected failures
        logger.error(`System Error [${errorType.toUpperCase()}]`, {
            ...logData,
            stack: error.stack
        });
    }

    const embed = createEmbed({
        title: getErrorTitle(errorType),
        description: userMessage,
        color: 'error',
        timestamp: true
    });

    if (errorType === ErrorTypes.RATE_LIMIT) {
        embed.addFields({
            name: "💡 Tipp",
            value: "Rate Limits verhindern Spam. Warte einen Moment, bevor du es erneut versuchst."
        });
    } else if (errorType === ErrorTypes.PERMISSION) {
        embed.addFields({
            name: "🔧 Benötigst du Hilfe?",
            value: "Kontaktiere einen Server-Administrator, wenn du glaubst, dass dies ein Fehler ist."
        });
    } else if (errorType === ErrorTypes.CONFIGURATION) {
        embed.addFields({
            name: "📋 Konfiguration",
            value: "Diese Funktion muss von einem Server-Administrator konfiguriert werden."
        });
    }

    try {
        
        if (!interaction || !interaction.id) {
            logger.warn('Interaction was null or invalid when handling error', {
                event: 'interaction.error.invalid_interaction',
                errorCode: ErrorCodes.INTERACTION_INVALID,
                remediationHint: getErrorMetadata(ErrorCodes.INTERACTION_INVALID).remediation,
                traceId
            });
            return;
        }

        
        if (interaction.createdTimestamp && (Date.now() - interaction.createdTimestamp) > 14 * 60 * 1000) {
            logger.warn('Interaction expired before error handler could send response', {
                event: 'interaction.error.expired',
                errorCode: ErrorCodes.INTERACTION_EXPIRED,
                remediationHint: getErrorMetadata(ErrorCodes.INTERACTION_EXPIRED).remediation,
                traceId,
                guildId: interaction.guildId,
                userId: interaction.user.id,
                command: interaction.commandName || context.command
            });
            return;
        }

        const errorMessage = { 
            embeds: [embed]
        };
        
        if (!interaction.deferred && !interaction.replied) {
            errorMessage.flags = MessageFlags.Ephemeral;
        }
        
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    } catch (replyError) {
        
        if (replyError.code === 40060 || replyError.code === 10062) {
            logger.warn('Interaction already acknowledged or expired, cannot send error response:', {
                event: 'interaction.error.response_unavailable',
                errorCode: String(replyError.code),
                traceId,
                guildId: interaction.guildId,
                userId: interaction.user.id,
                command: interaction.commandName || context.command,
                code: replyError.code
            });
            return;
        }
        logger.error('Failed to send error response:', {
            event: 'interaction.error.response_failed',
            errorCode: String(replyError.code || ErrorCodes.INTERACTION_RESPONSE_FAILED),
            remediationHint: getErrorMetadata(ErrorCodes.INTERACTION_RESPONSE_FAILED).remediation,
            traceId,
            guildId: interaction.guildId,
            userId: interaction.user.id,
            command: interaction.commandName || context.command,
            error: replyError
        });
    }
}




function getErrorTitle(errorType) {
    const titles = {
        [ErrorTypes.VALIDATION]: "❌ Ungültige Eingabe",
        [ErrorTypes.PERMISSION]: "🚫 Berechtigung verweigert",
        [ErrorTypes.CONFIGURATION]: "⚙️ Konfigurationsfehler",
        [ErrorTypes.DATABASE]: "🗄️ Datenbankfehler",
        [ErrorTypes.NETWORK]: "🌐 Netzwerkfehler",
        [ErrorTypes.DISCORD_API]: "🔌 API-Fehler",
        [ErrorTypes.USER_INPUT]: "💬 Eingabefehler",
        [ErrorTypes.RATE_LIMIT]: "⏱️ Verlangsam dich!",
        [ErrorTypes.UNKNOWN]: "❓ Unerwarteter Fehler"
    };
    
    return titles[errorType] || titles[ErrorTypes.UNKNOWN];
}




export function withErrorHandling(fn, context = {}) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            const interaction = args.find(arg => 
                arg && typeof arg === 'object' && 
                (arg.isCommand || arg.isButton || arg.isModalSubmit || arg.isStringSelectMenu || arg.isChatInputCommand)
            );
            
            if (interaction) {
                await handleInteractionError(interaction, error, context);
            } else {
                logger.error('Error in non-interaction context:', error);
            }
            
            return null;
        }
    };
}




export function createError(message, type = ErrorTypes.UNKNOWN, userMessage = null, context = {}) {
    const normalizedContext = {
        ...context,
        errorCode: context?.errorCode || getDefaultErrorCodeByType(type)
    };

    return new TitanBotError(message, type, userMessage, normalizedContext);
}

export default {
    ErrorTypes,
    TitanBotError,
    categorizeError,
    getUserMessage,
    handleInteractionError,
    withErrorHandling,
    createError
};




