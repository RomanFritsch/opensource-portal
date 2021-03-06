//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
//

'use strict';

import * as common from './common';
import { Operations } from "./operations";
import { Team } from "./team";
import { IGetOwnerToken } from '../transitional';
import { ICorporateLink } from './corporateLink';
import { IMailAddressProvider, GetAddressFromUpnAsync } from '../lib/mailAddressProvider';

const memberPrimaryProperties = [
  'id',
  'login',
  'permissions',
  'avatar_url',
];
const memberSecondaryProperties = [];

export class TeamMember {
  private _team: Team;
  private _getToken: IGetOwnerToken;
  private _operations: Operations;
  private _link: ICorporateLink;
  private _id: string;
  private _avatar_url: string;
  private _mailAddress: string;
  private _login: string;
  private _permissions: any;

  get team(): Team {
    return this._team;
  }

  get link(): ICorporateLink {
    return this._link;
  }

  get id(): string {
    return this._id;
  }

  get avatar_url(): string {
    return this._avatar_url;
  }

  get permissions(): any {
    return this._permissions;
  }

  get login(): string {
    return this._login;
  }

  set link(value: ICorporateLink) {
    console.log('Setter for TeamMember::link');
    this._link = value;
  }

  constructor(team: Team, entity: any, getToken: IGetOwnerToken, operations: Operations) {
    this._team = team;
    if (entity) {
      common.assignKnownFieldsPrefixed(this, entity, 'member', memberPrimaryProperties, memberSecondaryProperties);
    }
    this._getToken = getToken;
    this._operations = operations;
  }

  // ----------------------------------------------------------------------------
  // Retrieves the URL for the user's avatar, if present. If the user's details
  // have not been loaded, we will not yet have an avatar URL.
  // ----------------------------------------------------------------------------
  avatar(optionalSize) {
    if (!optionalSize) {
      optionalSize = 80;
    }
    if (this._avatar_url) {
      return this._avatar_url + '&s=' + optionalSize;
    }
  }

  get contactEmail() {
    return this._mailAddress || undefined;
  }

  get contactName() {
    return this._link ? this._link.corporateUsername : undefined;
  }

  async getMailAddress(): Promise<string> {
    if (this._mailAddress) {
      return this._mailAddress;
    }
    const operations = this._operations;
    const providers = operations.providers;
    const link = await this.resolveDirectLink();
    if (!providers.mailAddressProvider) {
      throw new Error('No mailAddressProvider is available in this application instance');
    }
    const mailAddress = await GetAddressFromUpnAsync(providers.mailAddressProvider, link.corporateUsername);
    this._mailAddress = mailAddress;
    return mailAddress;
  }

  async resolveDirectLink(): Promise<ICorporateLink> {
    // This method was added to directly attach a link instance
    // equivalent to the legacy implementation of team mgmt.
    // TODO: CONSIDER: a better design...
    if (this._link) {
      return this._link;
    }
    const operations = this._operations;
    const link = await operations.graphManager.getCachedLink(this._id);
    this._link = link;
    return link;
  }
}
