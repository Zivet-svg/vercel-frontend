document.addEventListener('DOMContentLoaded', function() {
    const purchaseForm = document.getElementById('purchaseForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoading = document.getElementById('btnLoading');
    
    // Discount system
    let appliedDiscount = null;
    const originalPrices = { monthly: 5.00, lifetime: 20.00 };
    
    // Predefined discount codes
    const discountCodes = {
        'WELCOME10': { type: 'percentage', value: 10, description: '10% off' },
        'SAVE20': { type: 'percentage', value: 20, description: '20% off' },
        'FIRST5': { type: 'fixed', value: 5, description: '$5 off' },
        'LIFETIME25': { type: 'percentage', value: 25, description: '25% off (Lifetime only)', planRestriction: 'lifetime' },
        'NEWUSER': { type: 'percentage', value: 15, description: '15% off' },
        'DISCORD': { type: 'fixed', value: 3, description: '$3 off' }
    };
    
    // Create popup HTML - shows immediately on page load
    const popupHTML = `
        <div id="discordPopup" class="modal fade" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-triangle"></i> IMPORTANT: Discord Required!
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <i class="fab fa-discord text-primary" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                        <h4 class="mb-3">You MUST join our Discord server first!</h4>
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i> <strong>Required:</strong> You need to be in our Discord server to receive your login credentials and use the product!
                        </div>
                        <p class="mb-4">Join our Discord server now, then come back to complete your purchase:</p>
                        <a href="https://discord.gg/CrJpprCV" target="_blank" class="btn btn-primary btn-lg mb-3">
                            <i class="fab fa-discord"></i> Join Discord Server
                        </a>
                        <p class="text-muted small">Discord Link: <code>https://discord.gg/CrJpprCV</code></p>
                        <div class="alert alert-info mt-3">
                            <i class="fas fa-info-circle"></i> After joining Discord, click "I'm in Discord" below to continue with your purchase.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" id="confirmDiscordJoin">
                            <i class="fas fa-check"></i> I'm in Discord - Continue Purchase
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add popup to body if it doesn't exist
    if (!document.getElementById('discordPopup')) {
        document.body.insertAdjacentHTML('beforeend', popupHTML);
    }
    
    // Track if user confirmed Discord membership
    let discordConfirmed = false;
    
    // Show popup immediately when page loads
    setTimeout(() => {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(document.getElementById('discordPopup'));
            modal.show();
        } else if (typeof $ !== 'undefined' && $.fn.modal) {
            $('#discordPopup').modal('show');
        } else {
            // Fallback - just show the modal div
            document.getElementById('discordPopup').style.display = 'block';
            document.getElementById('discordPopup').classList.add('show');
        }
    }, 500); // Small delay to ensure page is fully loaded
    
    // Handle Discord confirmation
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'confirmDiscordJoin') {
            discordConfirmed = true;
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('discordPopup'));
                if (modal) modal.hide();
            } else if (typeof $ !== 'undefined' && $.fn.modal) {
                $('#discordPopup').modal('hide');
            } else {
                // Fallback
                document.getElementById('discordPopup').style.display = 'none';
                document.getElementById('discordPopup').classList.remove('show');
            }
        }
        
        // Handle close button clicks
        if (e.target && (e.target.classList.contains('btn-close') || e.target.getAttribute('data-bs-dismiss') === 'modal')) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('discordPopup'));
                if (modal) modal.hide();
            } else if (typeof $ !== 'undefined' && $.fn.modal) {
                $('#discordPopup').modal('hide');
            } else {
                // Fallback
                document.getElementById('discordPopup').style.display = 'none';
                document.getElementById('discordPopup').classList.remove('show');
            }
        }
    });

    // Get plan from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    
    if (planParam) {
        const planRadio = document.getElementById(planParam);
        if (planRadio) {
            planRadio.checked = true;
        }
    }
    
    // Discount code functionality
    function updatePriceDisplay() {
        const monthlyPriceEl = document.getElementById('monthlyPrice');
        const lifetimePriceEl = document.getElementById('lifetimePrice');
        const monthlyOriginalEl = document.getElementById('monthlyOriginal');
        const lifetimeOriginalEl = document.getElementById('lifetimeOriginal');
        
        if (appliedDiscount) {
            const monthlyDiscounted = calculateDiscountedPrice('monthly', appliedDiscount);
            const lifetimeDiscounted = calculateDiscountedPrice('lifetime', appliedDiscount);
            
            // Show discounted prices
            if (monthlyDiscounted < originalPrices.monthly) {
                monthlyPriceEl.textContent = `$${monthlyDiscounted.toFixed(2)}`;
                monthlyOriginalEl.textContent = `$${originalPrices.monthly.toFixed(2)}`;
                monthlyOriginalEl.classList.remove('d-none');
            }
            
            if (lifetimeDiscounted < originalPrices.lifetime) {
                lifetimePriceEl.textContent = `$${lifetimeDiscounted.toFixed(2)}`;
                lifetimeOriginalEl.textContent = `$${originalPrices.lifetime.toFixed(2)}`;
                lifetimeOriginalEl.classList.remove('d-none');
            }
        } else {
            // Reset to original prices
            monthlyPriceEl.textContent = `$${originalPrices.monthly.toFixed(2)}`;
            lifetimePriceEl.textContent = `$${originalPrices.lifetime.toFixed(2)}`;
            monthlyOriginalEl.classList.add('d-none');
            lifetimeOriginalEl.classList.add('d-none');
        }
    }
    
    function calculateDiscountedPrice(plan, discount) {
        const originalPrice = originalPrices[plan];
        
        if (discount.planRestriction && discount.planRestriction !== plan) {
            return originalPrice;
        }
        
        if (discount.type === 'percentage') {
            return originalPrice * (1 - discount.value / 100);
        } else if (discount.type === 'fixed') {
            return Math.max(0, originalPrice - discount.value);
        }
        
        return originalPrice;
    }
    
    // Apply discount code
    document.getElementById('applyDiscount').addEventListener('click', function() {
        const codeInput = document.getElementById('discount_code');
        const code = codeInput.value.trim().toUpperCase();
        const messageEl = document.getElementById('discountMessage');
        const appliedEl = document.getElementById('discountApplied');
        const detailsEl = document.getElementById('discountDetails');
        
        if (!code) {
            messageEl.innerHTML = '<div class="alert alert-warning">Please enter a discount code.</div>';
            return;
        }
        
        if (discountCodes[code]) {
            appliedDiscount = { code: code, ...discountCodes[code] };
            
            messageEl.innerHTML = '';
            appliedEl.classList.remove('d-none');
            detailsEl.textContent = `${code} - ${appliedDiscount.description}`;
            codeInput.value = '';
            updatePriceDisplay();
        } else {
            messageEl.innerHTML = '<div class="alert alert-danger">Invalid discount code.</div>';
            appliedEl.classList.add('d-none');
        }
    });
    
    // Remove discount
    document.getElementById('removeDiscount').addEventListener('click', function() {
        appliedDiscount = null;
        document.getElementById('discountApplied').classList.add('d-none');
        document.getElementById('discountMessage').innerHTML = '';
        updatePriceDisplay();
    });
    
    // Allow Enter key to apply discount
    document.getElementById('discount_code').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('applyDiscount').click();
        }
    });

    // Modified form submission - now only processes if Discord is confirmed
    purchaseForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Check if Discord is confirmed first
        if (!discordConfirmed) {
            alert('Please join our Discord server first and click "I\'m in Discord" to continue with your purchase!');
            // Show the popup again
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = new bootstrap.Modal(document.getElementById('discordPopup'));
                modal.show();
            } else if (typeof $ !== 'undefined' && $.fn.modal) {
                $('#discordPopup').modal('show');
            }
            return;
        }
        
        // Proceed with purchase validation and processing
        processPurchase();
    });
    
    // Separate function to process the actual purchase
    async function processPurchase() {
        // Basic validation first
        const discordUserId = document.getElementById('discord_user_id').value.trim();
        const email = document.getElementById('email').value.trim();
        const productType = document.querySelector('input[name="product_type"]:checked').value;
        const paymentMethod = document.querySelector('input[name="payment_method"]:checked').value;
        let paymentProof = '';
        
        if (paymentMethod === 'paypal') {
            paymentProof = document.getElementById('paypal_proof').value.trim();
            if (!paymentProof) {
                alert('Please enter your PayPal email or transaction ID.');
                return;
            }
        } else if (paymentMethod === 'ltc') {
            paymentProof = document.getElementById('ltc_proof').value.trim();
            if (!paymentProof) {
                alert('Please enter your LTC transaction ID.');
                return;
            }
        } else if (paymentMethod === 'other') {
            paymentProof = 'User will DM on Discord.';
        }
        
        if (!discordUserId || !email) {
            alert('Please fill in all fields');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Disable button and show loading
        submitBtn.disabled = true;
        btnText.classList.add('d-none');
        btnLoading.classList.remove('d-none');
        
        try {
            // Calculate final price with discount
            let finalPrice = originalPrices[productType];
            let discountInfo = null;
            
            if (appliedDiscount) {
                finalPrice = calculateDiscountedPrice(productType, appliedDiscount);
                discountInfo = {
                    code: appliedDiscount.code,
                    description: appliedDiscount.description,
                    originalPrice: originalPrices[productType],
                    discountedPrice: finalPrice,
                    savings: originalPrices[productType] - finalPrice
                };
            }
            
            // Trigger Discord register flow (same as !register command)
            const response = await fetch('https://9e3f-67-205-158-33.ngrok-free.app/auth/trigger-discord-register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    discord_user_id: discordUserId,
                    product_type: productType,
                    payment_method: paymentMethod,
                    payment_proof: paymentProof,
                    discount_info: discountInfo,
                    final_price: finalPrice
                }),
            });
            
            if (response.ok) {
                const data = await response.json();
                let message = data.message || 'Registration complete! Check your Discord DMs for login credentials.';
                
                if (discountInfo && discountInfo.savings > 0) {
                    message += `\n\nDiscount Applied: ${discountInfo.code}\nFinal Price: $${finalPrice.toFixed(2)} (You saved $${discountInfo.savings.toFixed(2)}!)`;
                }
                
                alert(message);
                purchaseForm.reset();
                appliedDiscount = null;
                discordConfirmed = false; // Reset for next purchase
                updatePriceDisplay();
                document.getElementById('discountApplied').classList.add('d-none');
            } else {
                const data = await response.json();
                alert('Error: ' + (data.error || 'Failed to submit.'));
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred: ' + error.message);
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            btnText.classList.remove('d-none');
            btnLoading.classList.add('d-none');
        }
    }
    
    // Handle plan selection visual feedback
    const planOptions = document.querySelectorAll('.plan-option');
    planOptions.forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
        });
    });
}); 